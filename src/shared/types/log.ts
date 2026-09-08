export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

export interface LogEntry {
  id: string
  timestamp: number
  level: LogLevel
  message: string
  source: 'main' | 'renderer'
  context?: Record<string, string | number | boolean | null>
}

export interface LogQuery {
  level?: LogLevel
  limit?: number
  search?: string
}

export interface LogWritePayload {
  level: LogLevel
  message: string
  context?: Record<string, string | number | boolean | null>
}
