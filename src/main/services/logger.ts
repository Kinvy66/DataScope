import { app } from 'electron'
import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import type { LogEntry, LogLevel, LogQuery, LogWritePayload } from '@shared/types/log'

const LEVEL_RANK: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARNING: 30,
  ERROR: 40
}

class LoggerService {
  private entries: LogEntry[] = []
  private minLevel: LogLevel = 'DEBUG'
  private writeQueue: Promise<void> = Promise.resolve()

  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  async write(
    level: LogLevel,
    message: string,
    source: LogEntry['source'],
    context?: LogWritePayload['context']
  ): Promise<void> {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) {
      return
    }

    const entry: LogEntry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      level,
      message: sanitize(message),
      source,
      context: context ? sanitizeContext(context) : undefined
    }

    this.entries.push(entry)
    if (this.entries.length > 5000) {
      this.entries = this.entries.slice(-4000)
    }

    const line = formatLine(entry)
    if (level === 'ERROR') {
      console.error(line)
    } else if (level === 'WARNING') {
      console.warn(line)
    } else {
      console.log(line)
    }

    this.writeQueue = this.writeQueue.then(() => this.persist(line))
    await this.writeQueue
  }

  query(query: LogQuery = {}): LogEntry[] {
    const search = query.search?.trim().toLowerCase()
    const filtered = this.entries.filter((entry) => {
      if (query.level && entry.level !== query.level) return false
      if (!search) return true
      return entry.message.toLowerCase().includes(search)
    })
    const limit = query.limit ?? 500
    return filtered.slice(-limit)
  }

  private async persist(line: string): Promise<void> {
    try {
      const filePath = this.filePath()
      const directory = dirname(filePath)
      if (!existsSync(directory)) {
        await mkdir(directory, { recursive: true })
      }
      await appendFile(filePath, `${line}\n`, 'utf8')
    } catch (error) {
      console.error('Failed to persist log', error)
    }
  }

  private filePath(): string {
    const logsDir = app.isReady()
      ? join(app.getPath('userData'), 'logs')
      : join(process.cwd(), 'logs')
    const day = new Date().toISOString().slice(0, 10)
    return join(logsDir, `datascope-${day}.log`)
  }

  async readPersistedTail(maxBytes = 64_000): Promise<string> {
    const filePath = this.filePath()
    if (!existsSync(filePath)) return ''
    const content = await readFile(filePath, 'utf8')
    return content.slice(-maxBytes)
  }
}

function formatLine(entry: LogEntry): string {
  const time = new Date(entry.timestamp).toISOString()
  const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
  return `${time} [${entry.level}] [${entry.source}] ${entry.message}${context}`
}

function sanitize(message: string): string {
  return message.replace(/\b(token|password|secret|apikey)\s*=\s*([^\s]+)/gi, '$1=***')
}

function sanitizeContext(
  context: NonNullable<LogWritePayload['context']>
): NonNullable<LogWritePayload['context']> {
  const result: NonNullable<LogWritePayload['context']> = {}
  for (const [key, value] of Object.entries(context)) {
    if (/^(token|password|secret|apikey|api_key)$/i.test(key)) {
      result[key] = '***'
    } else {
      result[key] = value
    }
  }
  return result
}

export const logger = new LoggerService()
