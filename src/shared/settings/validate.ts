import { DataScopeError } from '../errors'
import {
  DEFAULT_CHANNEL_COUNT_MAX,
  DEFAULT_CHANNEL_COUNT_MIN,
  DEFAULT_SETTINGS,
  isAppLanguage,
  isAutosaveInterval,
  isExportFormatSetting,
  isLogLevelSetting,
  isThemeMode,
  isViewportCacheLimit,
  type AppSettings
} from '../types/settings'

const MAX_SAMPLE_RATE = 1_000_000
const MAX_RECENT = 50

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readPositiveRate(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > MAX_SAMPLE_RATE) {
    return fallback
  }
  return value
}

function readChannelCount(value: unknown, fallback: number): number {
  if (!Number.isInteger(value) || (value as number) < DEFAULT_CHANNEL_COUNT_MIN || (value as number) > DEFAULT_CHANNEL_COUNT_MAX) {
    return fallback
  }
  return value as number
}

function readRecentProjects(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const unique: string[] = []
  for (const item of value) {
    if (typeof item !== 'string' || item.trim() === '') continue
    if (!unique.includes(item)) unique.push(item)
  }
  return unique
}

/** Lenient merge for disk / unknown old settings.json. Unknown fields are dropped. */
export function mergeAppSettings(raw: unknown): AppSettings {
  const source = isRecord(raw) ? raw : {}
  const maxRecent =
    Number.isInteger(source.maxRecentProjects) &&
    (source.maxRecentProjects as number) >= 1 &&
    (source.maxRecentProjects as number) <= MAX_RECENT
      ? (source.maxRecentProjects as number)
      : DEFAULT_SETTINGS.maxRecentProjects

  return {
    theme: isThemeMode(source.theme) ? source.theme : DEFAULT_SETTINGS.theme,
    language: isAppLanguage(source.language) ? source.language : DEFAULT_SETTINGS.language,
    recentProjects: readRecentProjects(source.recentProjects).slice(0, maxRecent),
    maxRecentProjects: maxRecent,
    logLevel: isLogLevelSetting(source.logLevel) ? source.logLevel : DEFAULT_SETTINGS.logLevel,
    autosaveIntervalSec: isAutosaveInterval(source.autosaveIntervalSec)
      ? source.autosaveIntervalSec
      : DEFAULT_SETTINGS.autosaveIntervalSec,
    defaultSampleRate: readPositiveRate(source.defaultSampleRate, DEFAULT_SETTINGS.defaultSampleRate),
    defaultChannelCount: readChannelCount(source.defaultChannelCount, DEFAULT_SETTINGS.defaultChannelCount),
    defaultExportFormat: isExportFormatSetting(source.defaultExportFormat)
      ? source.defaultExportFormat
      : DEFAULT_SETTINGS.defaultExportFormat,
    viewportCacheLimit: isViewportCacheLimit(source.viewportCacheLimit)
      ? source.viewportCacheLimit
      : DEFAULT_SETTINGS.viewportCacheLimit
  }
}

/** Strict checks for user / IPC patches. Throws DataScopeError on illegal values. */
export function validateSettingsPatch(partial: Partial<AppSettings>): void {
  if (partial.theme !== undefined && !isThemeMode(partial.theme)) {
    throw new DataScopeError('VALIDATION_ERROR', '主题必须是 light 或 dark')
  }
  if (partial.language !== undefined && !isAppLanguage(partial.language)) {
    throw new DataScopeError('VALIDATION_ERROR', '语言必须是 zh-CN 或 en-US')
  }
  if (partial.logLevel !== undefined && !isLogLevelSetting(partial.logLevel)) {
    throw new DataScopeError('VALIDATION_ERROR', '日志级别无效')
  }
  if (partial.autosaveIntervalSec !== undefined && !isAutosaveInterval(partial.autosaveIntervalSec)) {
    throw new DataScopeError('VALIDATION_ERROR', '自动保存间隔必须是 0 / 30 / 60 / 120 / 300 秒')
  }
  if (partial.viewportCacheLimit !== undefined && !isViewportCacheLimit(partial.viewportCacheLimit)) {
    throw new DataScopeError('VALIDATION_ERROR', '波形缓存条目数必须是 0 / 8 / 16 / 32 / 64')
  }
  if (partial.defaultExportFormat !== undefined && !isExportFormatSetting(partial.defaultExportFormat)) {
    throw new DataScopeError('VALIDATION_ERROR', '默认导出格式必须是 csv、txt 或 json')
  }
  if (partial.defaultSampleRate !== undefined) {
    if (
      typeof partial.defaultSampleRate !== 'number' ||
      !Number.isFinite(partial.defaultSampleRate) ||
      partial.defaultSampleRate <= 0 ||
      partial.defaultSampleRate > MAX_SAMPLE_RATE
    ) {
      throw new DataScopeError('VALIDATION_ERROR', '默认采样率必须是大于 0 且不超过 1,000,000 的数字')
    }
  }
  if (partial.defaultChannelCount !== undefined) {
    if (
      !Number.isInteger(partial.defaultChannelCount) ||
      partial.defaultChannelCount < DEFAULT_CHANNEL_COUNT_MIN ||
      partial.defaultChannelCount > DEFAULT_CHANNEL_COUNT_MAX
    ) {
      throw new DataScopeError(
        'VALIDATION_ERROR',
        `默认通道数必须是 ${DEFAULT_CHANNEL_COUNT_MIN}–${DEFAULT_CHANNEL_COUNT_MAX} 的整数`
      )
    }
  }
  if (partial.maxRecentProjects !== undefined) {
    if (
      !Number.isInteger(partial.maxRecentProjects) ||
      partial.maxRecentProjects < 1 ||
      partial.maxRecentProjects > MAX_RECENT
    ) {
      throw new DataScopeError('VALIDATION_ERROR', '最近工程数量上限必须是 1–50 的整数')
    }
  }
  if (partial.recentProjects !== undefined && !Array.isArray(partial.recentProjects)) {
    throw new DataScopeError('VALIDATION_ERROR', '最近工程列表必须是字符串数组')
  }
}
