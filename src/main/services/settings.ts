import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { mergeAppSettings, validateSettingsPatch } from '@shared/settings/validate'
import { DEFAULT_SETTINGS, type AppSettings } from '@shared/types/settings'
import { logger } from './logger'

class SettingsService {
  private settings: AppSettings = { ...DEFAULT_SETTINGS, recentProjects: [] }
  private loaded = false

  async get(): Promise<AppSettings> {
    await this.ensureLoaded()
    return structuredClone(this.settings)
  }

  current(): AppSettings {
    return structuredClone(this.settings)
  }

  async set(partial: Partial<AppSettings>): Promise<AppSettings> {
    await this.ensureLoaded()
    validateSettingsPatch(partial)
    this.settings = mergeAppSettings({
      ...this.settings,
      ...partial,
      recentProjects: partial.recentProjects ?? this.settings.recentProjects
    })
    logger.setMinLevel(this.settings.logLevel)
    await this.persist()
    await logger.write('INFO', 'Settings updated', 'main', {
      fields: Object.keys(partial).join(',')
    })
    return structuredClone(this.settings)
  }

  async addRecentProject(rootPath: string): Promise<void> {
    await this.ensureLoaded()
    const next = [rootPath, ...this.settings.recentProjects.filter((item) => item !== rootPath)]
    this.settings.recentProjects = next.slice(0, this.settings.maxRecentProjects)
    await this.persist()
  }

  async clearRecent(): Promise<void> {
    await this.ensureLoaded()
    this.settings.recentProjects = []
    await this.persist()
    await logger.write('INFO', 'Recent project history cleared', 'main')
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    const filePath = this.filePath()
    if (!existsSync(filePath)) {
      this.loaded = true
      logger.setMinLevel(this.settings.logLevel)
      return
    }

    try {
      const raw = await readFile(filePath, 'utf8')
      const parsed: unknown = JSON.parse(raw)
      this.settings = mergeAppSettings(parsed)
      logger.setMinLevel(this.settings.logLevel)
    } catch (error) {
      await logger.write('WARNING', 'Failed to read settings, using defaults', 'main', {
        error: error instanceof Error ? error.message : 'unknown'
      })
      this.settings = { ...DEFAULT_SETTINGS, recentProjects: [] }
    }
    this.loaded = true
  }

  private async persist(): Promise<void> {
    const filePath = this.filePath()
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, JSON.stringify(this.settings, null, 2), 'utf8')
  }

  private filePath(): string {
    return join(app.getPath('userData'), 'settings.json')
  }
}

export const settingsService = new SettingsService()
