import { EXPORT_FORMATS, type ExportFormat } from './export'

export type ThemeMode = 'light' | 'dark'

export type AppLanguage = 'zh-CN' | 'en-US'

export type LogLevelSetting = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

export const AUTOSAVE_INTERVALS = [0, 30, 60, 120, 300] as const
export type AutosaveIntervalSec = (typeof AUTOSAVE_INTERVALS)[number]

export const VIEWPORT_CACHE_LIMITS = [0, 8, 16, 32, 64] as const
export type ViewportCacheLimit = (typeof VIEWPORT_CACHE_LIMITS)[number]

export const DEFAULT_CHANNEL_COUNT_MIN = 1
export const DEFAULT_CHANNEL_COUNT_MAX = 32

export interface AppSettings {
  theme: ThemeMode
  language: AppLanguage
  recentProjects: string[]
  maxRecentProjects: number
  logLevel: LogLevelSetting
  autosaveIntervalSec: AutosaveIntervalSec
  defaultSampleRate: number
  defaultChannelCount: number
  defaultExportFormat: ExportFormat
  viewportCacheLimit: ViewportCacheLimit
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'zh-CN',
  recentProjects: [],
  maxRecentProjects: 12,
  logLevel: 'INFO',
  autosaveIntervalSec: 0,
  defaultSampleRate: 1000,
  defaultChannelCount: 2,
  defaultExportFormat: 'csv',
  viewportCacheLimit: 16
}

export const APP_LANGUAGES: AppLanguage[] = ['zh-CN', 'en-US']

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'zh-CN' || value === 'en-US'
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

export function isLogLevelSetting(value: unknown): value is LogLevelSetting {
  return value === 'DEBUG' || value === 'INFO' || value === 'WARNING' || value === 'ERROR'
}

export function isAutosaveInterval(value: unknown): value is AutosaveIntervalSec {
  return (AUTOSAVE_INTERVALS as readonly number[]).includes(value as number)
}

export function isViewportCacheLimit(value: unknown): value is ViewportCacheLimit {
  return (VIEWPORT_CACHE_LIMITS as readonly number[]).includes(value as number)
}

export function isExportFormatSetting(value: unknown): value is ExportFormat {
  return (EXPORT_FORMATS as readonly string[]).includes(value as string)
}
