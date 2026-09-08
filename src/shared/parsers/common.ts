import { CHANNEL_COLORS } from '../constants'
import { DataScopeError } from '../errors'
import type { Channel, Dataset, DatasetMetadata, SourceFormat } from '../types/dataset'

export interface ParsedTable {
  channelNames: string[]
  timestamps: number[]
  columns: number[][]
}

export interface BuildDatasetInput {
  name: string
  table: ParsedTable
  sourcePath: string
  sourceFormat: SourceFormat
  fileSize: number
  encoding: string
  sampleRateHint?: number
}

const HEADER_PATTERN = /^[a-zA-Z_\u4e00-\u9fff][\w\u4e00-\u9fff-]*$/

export function isHeaderCell(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (isFiniteNumber(trimmed)) return false
  return HEADER_PATTERN.test(trimmed) || trimmed.toLowerCase() === 'timestamp'
}

export function isFiniteNumber(value: string): boolean {
  if (value.trim() === '') return false
  const numeric = Number(value)
  return Number.isFinite(numeric)
}

export function parseNumericCell(
  value: string,
  row: number,
  column: number
): number {
  const trimmed = value.trim()
  if (trimmed === '') {
    throw new DataScopeError('NON_NUMERIC', `第 ${row} 行第 ${column} 列为空`, {
      row,
      column
    })
  }

  const lower = trimmed.toLowerCase()
  if (lower === 'nan' || lower === 'infinity' || lower === '+infinity' || lower === '-infinity') {
    throw new DataScopeError('NAN_OR_INFINITY', `第 ${row} 行第 ${column} 列包含 ${trimmed}`, {
      row,
      column
    })
  }

  const numeric = Number(trimmed)
  if (Number.isNaN(numeric)) {
    throw new DataScopeError('NON_NUMERIC', `第 ${row} 行第 ${column} 列不是数字: ${trimmed}`, {
      row,
      column
    })
  }

  if (!Number.isFinite(numeric)) {
    throw new DataScopeError('NAN_OR_INFINITY', `第 ${row} 行第 ${column} 列包含 Infinity`, {
      row,
      column
    })
  }

  return numeric
}

export function inferSampleRate(timestamps: number[]): number {
  if (timestamps.length < 2) {
    return 1000
  }

  const deltas: number[] = []
  for (let i = 1; i < timestamps.length; i += 1) {
    const delta = timestamps[i] - timestamps[i - 1]
    if (delta > 0) {
      deltas.push(delta)
    }
  }

  if (deltas.length === 0) {
    throw new DataScopeError('INVALID_TIMESTAMP', '时间戳未递增，无法推断采样率')
  }

  deltas.sort((a, b) => a - b)
  const median = deltas[Math.floor(deltas.length / 2)]
  return 1 / median
}

export function validateTimestamps(timestamps: number[]): void {
  if (timestamps.length === 0) {
    throw new DataScopeError('INVALID_TIMESTAMP', '缺少时间戳列')
  }

  for (let i = 1; i < timestamps.length; i += 1) {
    if (timestamps[i] < timestamps[i - 1]) {
      throw new DataScopeError(
        'INVALID_TIMESTAMP',
        `时间戳必须单调递增，第 ${i + 1} 行早于上一行`,
        { row: i + 1 }
      )
    }
  }
}

export function splitDelimitedLine(line: string, delimiter: string | RegExp): string[] {
  return line.split(delimiter).map((cell) => cell.trim().replace(/^["']|["']$/g, ''))
}

export function detectDelimiter(headerLine: string): string | RegExp {
  if (headerLine.includes(',')) return ','
  if (headerLine.includes('\t')) return '\t'
  if (headerLine.includes(';')) return ';'
  return /\s+/
}

export function createChannels(names: string[]): Channel[] {
  return names.map((name, index) => ({
    id: `ch-${index + 1}`,
    name,
    unit: '',
    color: CHANNEL_COLORS[index % CHANNEL_COLORS.length],
    visible: true,
    index
  }))
}

export function buildDataset(input: BuildDatasetInput): Dataset {
  const { table } = input
  if (table.columns.length === 0) {
    throw new DataScopeError('INVALID_CHANNEL_COUNT', '未检测到有效通道')
  }

  const sampleCount = table.timestamps.length
  for (const column of table.columns) {
    if (column.length !== sampleCount) {
      throw new DataScopeError('COLUMN_MISMATCH', '通道数据长度与时间戳不一致')
    }
  }

  validateTimestamps(table.timestamps)

  const sampleRate = input.sampleRateHint ?? inferSampleRate(table.timestamps)
  if (!(sampleRate > 0) || !Number.isFinite(sampleRate)) {
    throw new DataScopeError('VALIDATION_ERROR', '采样率必须为正数')
  }

  const metadata: DatasetMetadata = {
    sourcePath: input.sourcePath,
    sourceFormat: input.sourceFormat,
    importedAt: Date.now(),
    fileSize: input.fileSize,
    encoding: input.encoding
  }

  return {
    id: createId('ds'),
    name: input.name,
    sampleRate,
    channelCount: table.columns.length,
    sampleCount,
    startTime: table.timestamps[0] ?? 0,
    channels: createChannels(table.channelNames),
    samples: table.columns,
    markers: [],
    metadata
  }
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

