import { dialog } from 'electron'
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  DEFAULT_PROJECT_SETTINGS,
  type CreateProjectInput,
  type ProjectFile,
  type ProjectState,
  type UpdateProjectInput
} from '@shared/types/project'
import { PROJECT_FILE_NAME, PROJECT_SCHEMA_VERSION } from '@shared/constants'
import { DataScopeError } from '@shared/errors'
import { logger } from './logger'
import { settingsService } from './settings'
import { datasetRegistry } from './datasetRegistry'

class ProjectService {
  private current: ProjectState | null = null

  getCurrent(): ProjectState | null {
    return this.current ? structuredClone(this.current) : null
  }

  isDirty(): boolean {
    return this.current?.dirty === true
  }

  async create(input: CreateProjectInput): Promise<ProjectState> {
    const name = input.name.trim()
    if (!name) {
      throw new DataScopeError('VALIDATION_ERROR', '工程名称不能为空')
    }
    if (!input.location.trim()) {
      throw new DataScopeError('VALIDATION_ERROR', '工程路径不能为空')
    }

    const rootPath = join(input.location, name)
    if (existsSync(rootPath) && (await hasEntries(rootPath))) {
      throw new DataScopeError('VALIDATION_ERROR', `目标目录已存在且不为空: ${rootPath}`)
    }

    await mkdir(join(rootPath, 'data'), { recursive: true })
    await mkdir(join(rootPath, 'exports'), { recursive: true })
    await mkdir(join(rootPath, 'analysis'), { recursive: true })
    await mkdir(join(rootPath, 'logs'), { recursive: true })

    const now = Date.now()
    const file: ProjectFile = {
      version: PROJECT_SCHEMA_VERSION,
      name,
      description: input.description.trim(),
      createdAt: now,
      modifiedAt: now,
      sampleRate: 1000,
      channelCount: 0,
      dataFiles: [],
      markers: [],
      settings: { ...DEFAULT_PROJECT_SETTINGS }
    }

    await writeFile(join(rootPath, PROJECT_FILE_NAME), JSON.stringify(file, null, 2), 'utf8')
    datasetRegistry.clear()
    this.current = { rootPath, file, dirty: false }
    await settingsService.addRecentProject(rootPath)
    await logger.write('INFO', 'Project created', 'main', { path: rootPath, name })
    return this.getCurrent() as ProjectState
  }

  async open(rootPath: string): Promise<ProjectState> {
    const projectFilePath = resolveProjectFile(rootPath)
    if (!existsSync(projectFilePath)) {
      throw new DataScopeError('PROJECT_NOT_FOUND', `工程不存在: ${projectFilePath}`, {
        path: projectFilePath
      })
    }

    let parsed: unknown
    try {
      const raw = await readFile(projectFilePath, 'utf8')
      parsed = JSON.parse(raw) as unknown
    } catch {
      throw new DataScopeError('PROJECT_INVALID', '工程文件已损坏或不是有效 JSON')
    }

    const file = validateProjectFile(parsed)
    const actualRoot = dirname(projectFilePath)
    datasetRegistry.clear()
    this.current = { rootPath: actualRoot, file, dirty: false }
    await settingsService.addRecentProject(actualRoot)
    await logger.write('INFO', 'Project opened', 'main', { path: actualRoot, name: file.name })
    return this.getCurrent() as ProjectState
  }

  async save(): Promise<ProjectState> {
    if (!this.current) {
      throw new DataScopeError('PROJECT_NOT_OPEN', '当前没有打开的工程')
    }
    this.current.file.modifiedAt = Date.now()
    await writeFile(
      join(this.current.rootPath, PROJECT_FILE_NAME),
      JSON.stringify(this.current.file, null, 2),
      'utf8'
    )
    this.current.dirty = false
    await logger.write('INFO', 'Project saved', 'main', { path: this.current.rootPath })
    return this.getCurrent() as ProjectState
  }

  async saveAs(targetRoot?: string): Promise<ProjectState> {
    if (!this.current) {
      throw new DataScopeError('PROJECT_NOT_OPEN', '当前没有打开的工程')
    }

    let destination = targetRoot
    if (!destination) {
      const result = await dialog.showOpenDialog({
        title: '选择另存为目录',
        properties: ['openDirectory', 'createDirectory']
      })
      if (result.canceled || result.filePaths.length === 0) {
        return this.getCurrent() as ProjectState
      }
      destination = join(result.filePaths[0], this.current.file.name)
    }

    if (destination === this.current.rootPath) {
      return this.save()
    }

    await copyDirectory(this.current.rootPath, destination)
    this.current.rootPath = destination
    this.current.file.modifiedAt = Date.now()
    await this.save()
    await settingsService.addRecentProject(destination)
    await logger.write('INFO', 'Project saved as', 'main', { path: destination })
    return this.getCurrent() as ProjectState
  }

  async close(): Promise<void> {
    if (!this.current) return
    const name = this.current.file.name
    this.current = null
    datasetRegistry.clear()
    await logger.write('INFO', 'Project closed', 'main', { name })
  }

  async update(input: UpdateProjectInput): Promise<ProjectState> {
    if (!this.current) {
      throw new DataScopeError('PROJECT_NOT_OPEN', '当前没有打开的工程')
    }
    if (input.name !== undefined) {
      const name = input.name.trim()
      if (!name) throw new DataScopeError('VALIDATION_ERROR', '工程名称不能为空')
      this.current.file.name = name
    }
    if (input.description !== undefined) {
      this.current.file.description = input.description
    }
    if (input.sampleRate !== undefined) {
      if (!(input.sampleRate > 0)) {
        throw new DataScopeError('VALIDATION_ERROR', '采样率必须大于 0')
      }
      this.current.file.sampleRate = input.sampleRate
    }
    if (input.settings) {
      this.current.file.settings = { ...this.current.file.settings, ...input.settings }
    }
    this.current.file.modifiedAt = Date.now()
    this.current.dirty = true
    return this.getCurrent() as ProjectState
  }

  markDirty(): void {
    if (this.current) {
      this.current.dirty = true
      this.current.file.modifiedAt = Date.now()
    }
  }

  requireOpen(): ProjectState {
    if (!this.current) {
      throw new DataScopeError('PROJECT_NOT_OPEN', '请先新建或打开一个工程')
    }
    return this.current
  }

  dataDirectory(): string {
    return join(this.requireOpen().rootPath, 'data')
  }

  replaceFile(file: ProjectFile): void {
    if (!this.current) return
    this.current.file = file
    this.current.dirty = true
  }
}

function resolveProjectFile(rootPath: string): string {
  if (rootPath.toLowerCase().endsWith(PROJECT_FILE_NAME)) {
    return rootPath
  }
  return join(rootPath, PROJECT_FILE_NAME)
}

function validateProjectFile(value: unknown): ProjectFile {
  if (!value || typeof value !== 'object') {
    throw new DataScopeError('PROJECT_INVALID', 'project.json 格式错误')
  }

  const candidate = value as Partial<ProjectFile>
  const required: Array<keyof ProjectFile> = [
    'version',
    'name',
    'description',
    'createdAt',
    'modifiedAt',
    'sampleRate',
    'channelCount',
    'dataFiles',
    'markers',
    'settings'
  ]

  for (const key of required) {
    if (candidate[key] === undefined) {
      throw new DataScopeError('PROJECT_INVALID', `project.json 缺少字段: ${key}`)
    }
  }

  if (!Array.isArray(candidate.dataFiles) || !Array.isArray(candidate.markers)) {
    throw new DataScopeError('PROJECT_INVALID', 'project.json 中的 dataFiles 或 markers 不是数组')
  }

  return {
    version: String(candidate.version),
    name: String(candidate.name),
    description: String(candidate.description ?? ''),
    createdAt: Number(candidate.createdAt),
    modifiedAt: Number(candidate.modifiedAt),
    sampleRate: Number(candidate.sampleRate),
    channelCount: Number(candidate.channelCount),
    dataFiles: candidate.dataFiles,
    markers: candidate.markers,
    settings: {
      ...DEFAULT_PROJECT_SETTINGS,
      ...(candidate.settings ?? {})
    }
  }
}

async function hasEntries(directory: string): Promise<boolean> {
  if (!existsSync(directory)) return false
  const entries = await readdir(directory)
  return entries.length > 0
}

async function copyDirectory(source: string, destination: string): Promise<void> {
  if (existsSync(destination)) {
    await rm(destination, { recursive: true, force: true })
  }
  await mkdir(destination, { recursive: true })
  const entries = await readdir(source, { withFileTypes: true })
  for (const entry of entries) {
    const from = join(source, entry.name)
    const to = join(destination, entry.name)
    if (entry.isDirectory()) {
      await copyDirectory(from, to)
    } else {
      await copyFile(from, to)
    }
  }
}

export const projectService = new ProjectService()
