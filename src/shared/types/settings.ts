export type ThemeMode = 'light' | 'dark'

export type LogLevelSetting = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

export interface AppSettings {
  theme: ThemeMode
  language: 'zh-CN' | 'en-US'
  recentProjects: string[]
  maxRecentProjects: number
  logLevel: LogLevelSetting
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'zh-CN',
  recentProjects: [],
  maxRecentProjects: 12,
  logLevel: 'INFO'
}
