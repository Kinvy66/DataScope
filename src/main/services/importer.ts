import { copyFile, mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { LARGE_DATASET_THRESHOLD } from '@shared/constants'
import { DataScopeError } from '@shared/errors'
import { parseCSV, parseTXT } from '@shared/parsers/csv'
import { parseJSON } from '@shared/parsers/json'
import { validateDatasetName } from '@shared/datasets/query'
import {
  applyProjectMarkers,
  createMarker,
  insertMarker,
  removeMarker as removeMarkerFromList,
  replaceMarker,
  toProjectMarkerRef,
  updateMarker as applyMarkerDraft
} from '@shared/markers/manage'
import { validateDataset } from '@shared/parsers/dataset'
import { applyFilterToDatasetAsync } from '@shared/filters/apply'
import { describeFilter } from '@shared/algorithms/filter'
import { generateChannel, serializeGeneratedJson } from '@shared/generators/waveform'
import { resolveSampleCount, validateGeneratorRequest } from '@shared/generators/validate'
import { buildDataset } from '@shared/parsers/common'
import type { Dataset, DatasetInfo, Marker, MarkerDraft, SourceFormat } from '@shared/types/dataset'
import type { FilterRequest } from '@shared/types/filter'
import type { GeneratorRequest } from '@shared/types/generator'
import type { DataFileRef } from '@shared/types/project'
import type { TaskContext } from '@shared/types/task'
import { logger } from './logger'
import { projectService } from './project'
import { datasetRegistry } from './datasetRegistry'
import { taskService } from './tasks'

export async function importDataset(filePath: string, format: SourceFormat): Promise<DatasetInfo> {
  return taskService.run<DatasetInfo>(`导入 ${basename(filePath)}`, {
    kind: 'import',
    filePath,
    format
  })
}

export async function importDatasetWork(
  filePath: string,
  format: SourceFormat,
  ctx: TaskContext
): Promise<DatasetInfo> {
  const project = projectService.requireOpen()
  if (!existsSync(filePath)) {
    throw new DataScopeError('FILE_NOT_FOUND', `文件不存在: ${filePath}`, { path: filePath })
  }

  await ctx.checkpoint()
  ctx.report(0.08, '读取文件')

  let fileStat
  try {
    fileStat = await stat(filePath)
  } catch {
    throw new DataScopeError('FILE_PERMISSION', `无法访问文件: ${filePath}`)
  }

  const content = await readFile(filePath)
  await ctx.checkpoint()
  ctx.report(0.35, '解析数据')
  const { text, encoding } = decodeText(content)
  const dataset = parseContent(text, filePath, format)
  dataset.metadata.fileSize = fileStat.size
  dataset.metadata.encoding = encoding
  validateDataset(dataset)

  if (dataset.sampleCount * dataset.channelCount >= LARGE_DATASET_THRESHOLD) {
    await logger.write('WARNING', 'Large dataset detected', 'main', {
      samples: dataset.sampleCount,
      channels: dataset.channelCount
    })
  }

  await ctx.checkpoint()
  ctx.report(0.72, '写入工程')
  const dataDir = projectService.dataDirectory()
  await mkdir(dataDir, { recursive: true })
  const targetName = uniqueFileName(dataDir, basename(filePath))
  const targetPath = join(dataDir, targetName)
  await copyFile(filePath, targetPath)
  dataset.metadata.sourcePath = targetPath

  const info = datasetRegistry.add(dataset)
  const ref: DataFileRef = {
    id: dataset.id,
    name: dataset.name,
    relativePath: `data/${targetName}`,
    format,
    sampleRate: dataset.sampleRate,
    channelCount: dataset.channelCount,
    sampleCount: dataset.sampleCount,
    importedAt: dataset.metadata.importedAt
  }

  project.file.dataFiles = [...project.file.dataFiles, ref]
  project.file.channelCount = Math.max(project.file.channelCount, dataset.channelCount)
  if (dataset.sampleRate > 0) {
    project.file.sampleRate = dataset.sampleRate
  }
  projectService.markDirty()

  await logger.write('INFO', 'Dataset imported', 'main', {
    name: dataset.name,
    channels: dataset.channelCount,
    samples: dataset.sampleCount,
    format
  })

  ctx.report(1, '完成')
  return info
}

export async function generateDataset(request: GeneratorRequest): Promise<DatasetInfo> {
  return taskService.run<DatasetInfo>(`生成 ${request.name.trim() || '数据集'}`, {
    kind: 'generate',
    request
  })
}

export async function generateDatasetWork(
  request: GeneratorRequest,
  ctx: TaskContext
): Promise<DatasetInfo> {
  const input = validateGeneratorRequest(request)
  const sampleCount = resolveSampleCount(input.sampleRate, input.duration)
  const channelNames = Array.from({ length: input.channelCount }, (_, index) => `ch${index + 1}`)
  const timestamps = Array.from({ length: sampleCount }, (_, n) => n / input.sampleRate)
  const columns: number[][] = []

  ctx.report(0.04, '正在生成波形')
  for (let channel = 0; channel < input.channelCount; channel += 1) {
    await ctx.checkpoint()
    columns.push(generateChannel(input, channel, sampleCount))
    ctx.report(
      0.08 + ((channel + 1) / input.channelCount) * 0.72,
      `生成通道 ${channel + 1}/${input.channelCount}`
    )
  }

  await ctx.checkpoint()
  ctx.report(0.86, '写入工程')
  const dataset = buildDataset({
    name: input.name,
    table: { channelNames, timestamps, columns },
    sourcePath: `${input.name}.json`,
    sourceFormat: 'json',
    fileSize: 0,
    encoding: 'utf-8',
    sampleRateHint: input.sampleRate
  })
  const info = await saveDatasetToProject(dataset)
  await logger.write('INFO', 'Dataset generated', 'main', {
    name: dataset.name,
    kind: request.kind,
    channels: dataset.channelCount,
    samples: dataset.sampleCount
  })
  ctx.report(1, '完成')
  return info
}

export async function filterDataset(request: FilterRequest): Promise<DatasetInfo> {
  projectService.requireOpen()
  if (!request?.datasetId) {
    throw new DataScopeError('VALIDATION_ERROR', '缺少数据集 ID')
  }
  const source = datasetRegistry.get(request.datasetId)
  return taskService.run<DatasetInfo>(`滤波 · ${source.name}`, {
    kind: 'filter',
    request
  })
}

export async function filterDatasetWork(request: FilterRequest, ctx: TaskContext): Promise<DatasetInfo> {
  projectService.requireOpen()
  if (!request?.datasetId) {
    throw new DataScopeError('VALIDATION_ERROR', '缺少数据集 ID')
  }

  const source = datasetRegistry.get(request.datasetId)
  await logger.write('INFO', 'Filter Start', 'main', {
    dataset: source.name,
    kind: request.kind,
    channels: request.channelIds.length
  })

  ctx.report(0.05, '准备滤波')
  const dataset = await applyFilterToDatasetAsync(source, request, async (index, total) => {
    await ctx.checkpoint()
    ctx.report(0.08 + (index / Math.max(total, 1)) * 0.72, `滤波通道 ${index + 1}/${total}`)
  })

  await ctx.checkpoint()
  ctx.report(0.86, '写入工程')
  const info = await saveDatasetToProject(dataset)

  await logger.write('INFO', 'Filter Complete', 'main', {
    source: source.name,
    name: dataset.name,
    kind: request.kind,
    label: describeFilter(request),
    channels: request.channelIds.length
  })
  ctx.report(1, '完成')
  return info
}

export async function saveDatasetToProject(dataset: Dataset): Promise<DatasetInfo> {
  const project = projectService.requireOpen()
  validateDataset(dataset)

  if (dataset.sampleCount * dataset.channelCount >= LARGE_DATASET_THRESHOLD) {
    await logger.write('WARNING', 'Large dataset detected', 'main', {
      samples: dataset.sampleCount,
      channels: dataset.channelCount
    })
  }

  const dataDir = projectService.dataDirectory()
  await mkdir(dataDir, { recursive: true })
  const stem = dataset.name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 48) || 'dataset'
  const targetName = uniqueFileName(dataDir, `${stem}.json`)
  const targetPath = join(dataDir, targetName)
  const json = serializeGeneratedJson(dataset)
  await writeFile(targetPath, json, 'utf8')
  dataset.metadata.sourcePath = targetPath
  dataset.metadata.fileSize = Buffer.byteLength(json)

  const info = datasetRegistry.add(dataset)
  const ref: DataFileRef = {
    id: dataset.id,
    name: dataset.name,
    relativePath: `data/${targetName}`,
    format: 'json',
    sampleRate: dataset.sampleRate,
    channelCount: dataset.channelCount,
    sampleCount: dataset.sampleCount,
    importedAt: dataset.metadata.importedAt
  }

  project.file.dataFiles = [...project.file.dataFiles, ref]
  project.file.channelCount = Math.max(project.file.channelCount, dataset.channelCount)
  if (dataset.sampleRate > 0) {
    project.file.sampleRate = dataset.sampleRate
  }
  projectService.markDirty()
  return info
}

export async function loadProjectDatasets(): Promise<DatasetInfo[]> {
  const project = projectService.getCurrent()
  if (!project) return []

  datasetRegistry.clear()
  const loaded: DatasetInfo[] = []

  for (const ref of project.file.dataFiles) {
    const absolutePath = join(project.rootPath, ref.relativePath)
    if (!existsSync(absolutePath)) {
      await logger.write('WARNING', 'Project data file missing', 'main', { path: absolutePath })
      continue
    }
    try {
      const content = await readFile(absolutePath)
      const { text, encoding } = decodeText(content)
      const dataset = parseContent(text, absolutePath, ref.format)
      dataset.id = ref.id
      dataset.name = ref.name
      dataset.metadata.encoding = encoding
      dataset.markers = applyProjectMarkers(dataset, project.file.markers)
      validateDataset(dataset)
      loaded.push(datasetRegistry.add(dataset))
    } catch (error) {
      await logger.write('ERROR', 'Failed to load project dataset', 'main', {
        path: absolutePath,
        error: error instanceof Error ? error.message : 'unknown'
      })
    }
  }

  return loaded
}

export async function renameDataset(datasetId: string, name: string): Promise<DatasetInfo> {
  const project = projectService.requireOpen()
  const normalized = validateDatasetName(name)
  const info = datasetRegistry.rename(datasetId, normalized)
  const ref = project.file.dataFiles.find((item) => item.id === datasetId)
  if (ref) {
    ref.name = normalized
  }
  projectService.markDirty()
  await logger.write('INFO', 'Dataset renamed', 'main', { id: datasetId, name: normalized })
  return info
}

export async function removeDataset(datasetId: string): Promise<void> {
  const project = projectService.requireOpen()
  const ref = project.file.dataFiles.find((item) => item.id === datasetId)
  datasetRegistry.remove(datasetId)
  project.file.dataFiles = project.file.dataFiles.filter((item) => item.id !== datasetId)
  project.file.markers = project.file.markers.filter((item) => item.datasetId !== datasetId)
  project.file.channelCount = project.file.dataFiles.reduce(
    (max, item) => Math.max(max, item.channelCount),
    0
  )
  if (ref) {
    const absolutePath = join(project.rootPath, ref.relativePath)
    try {
      if (existsSync(absolutePath)) {
        await unlink(absolutePath)
      }
    } catch {
      await logger.write('WARNING', 'Failed to delete dataset file', 'main', { path: absolutePath })
    }
  }
  projectService.markDirty()
  await logger.write('INFO', 'Dataset removed', 'main', { id: datasetId })
}

export async function addMarker(datasetId: string, draft: MarkerDraft): Promise<DatasetInfo> {
  projectService.requireOpen()
  const dataset = datasetRegistry.get(datasetId)
  const marker = createMarker(dataset, draft)
  const markers = insertMarker(dataset.markers, marker)
  return persistMarkers(datasetId, markers, 'Marker added')
}

export async function updateMarker(
  datasetId: string,
  markerId: string,
  draft: MarkerDraft
): Promise<DatasetInfo> {
  projectService.requireOpen()
  const dataset = datasetRegistry.get(datasetId)
  const current = dataset.markers.find((item) => item.id === markerId)
  if (!current) {
    throw new DataScopeError('FILE_NOT_FOUND', `未找到 Marker: ${markerId}`)
  }
  const marker = applyMarkerDraft(dataset, current, draft)
  const markers = replaceMarker(dataset.markers, marker)
  return persistMarkers(datasetId, markers, 'Marker updated')
}

export async function removeMarker(datasetId: string, markerId: string): Promise<DatasetInfo> {
  projectService.requireOpen()
  const dataset = datasetRegistry.get(datasetId)
  const markers = removeMarkerFromList(dataset.markers, markerId)
  return persistMarkers(datasetId, markers, 'Marker removed')
}

function persistMarkers(datasetId: string, markers: Marker[], logMessage: string): DatasetInfo {
  const project = projectService.requireOpen()
  const info = datasetRegistry.setMarkers(datasetId, markers)
  project.file.markers = [
    ...project.file.markers.filter((item) => item.datasetId !== datasetId),
    ...markers.map((marker) => toProjectMarkerRef(datasetId, marker))
  ]
  projectService.markDirty()
  void logger.write('INFO', logMessage, 'main', {
    datasetId,
    count: markers.length
  })
  return info
}

function parseContent(content: string, filePath: string, format: SourceFormat): Dataset {
  if (format === 'csv') return parseCSV(content, filePath)
  if (format === 'txt') return parseTXT(content, filePath)
  return parseJSON(content, filePath)
}

function uniqueFileName(directory: string, fileName: string): string {
  if (!existsSync(join(directory, fileName))) return fileName
  const ext = extname(fileName)
  const stem = basename(fileName, ext)
  let index = 1
  while (existsSync(join(directory, `${stem}-${index}${ext}`))) {
    index += 1
  }
  return `${stem}-${index}${ext}`
}

export function decodeText(buffer: Buffer): { text: string; encoding: string } {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return { text: buffer.subarray(3).toString('utf8'), encoding: 'utf-8-bom' }
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return { text: buffer.subarray(2).toString('utf16le'), encoding: 'utf16le' }
  }

  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.alloc(buffer.length - 2)
    for (let i = 2; i + 1 < buffer.length; i += 2) {
      swapped[i - 2] = buffer[i + 1]
      swapped[i - 1] = buffer[i]
    }
    return { text: swapped.toString('utf16le'), encoding: 'utf16be' }
  }

  return { text: buffer.toString('utf8'), encoding: 'utf-8' }
}

export function inferFormatFromPath(filePath: string): SourceFormat {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.json') return 'json'
  if (ext === '.txt') return 'txt'
  return 'csv'
}
