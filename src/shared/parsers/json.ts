import { DataScopeError } from '../errors'
import type { Dataset } from '../types/dataset'
import { buildDataset, parseNumericCell, type ParsedTable } from './common'

interface JsonDatasetFile {
  name?: string
  sampleRate?: number
  startTime?: number
  channels?: Array<string | { name: string; unit?: string }>
  channelNames?: string[]
  data?: number[][]
  samples?: number[][]
  timestamps?: number[]
}

export function parseJSON(content: string, sourcePath = 'memory.json'): Dataset {
  const trimmed = content.trim()
  if (!trimmed) {
    throw new DataScopeError('FILE_EMPTY', 'JSON 文件为空')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed) as unknown
  } catch {
    throw new DataScopeError('INVALID_FORMAT', 'JSON 解析失败，文件格式不正确')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DataScopeError('INVALID_FORMAT', 'JSON 根节点必须是对象')
  }

  const file = parsed as JsonDatasetFile
  const matrix = file.data ?? file.samples
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new DataScopeError('FILE_EMPTY', 'JSON 中没有 samples/data 数组')
  }

  const channelNames = resolveChannelNames(file, matrix)
  const { timestamps, columns } = extractTable(file, matrix, channelNames)

  const table: ParsedTable = { channelNames, timestamps, columns }
  const name = file.name || fileNameFromPath(sourcePath)

  return buildDataset({
    name,
    table,
    sourcePath,
    sourceFormat: 'json',
    fileSize: new TextEncoder().encode(content).length,
    encoding: 'utf-8',
    sampleRateHint: file.sampleRate
  })
}

function resolveChannelNames(file: JsonDatasetFile, matrix: number[][]): string[] {
  if (Array.isArray(file.channelNames) && file.channelNames.length > 0) {
    return file.channelNames
  }

  if (Array.isArray(file.channels) && file.channels.length > 0) {
    return file.channels.map((channel, index) => {
      if (typeof channel === 'string') return channel
      return channel.name || `ch${index + 1}`
    })
  }

  const firstRow = matrix[0]
  if (!Array.isArray(firstRow) || firstRow.length < 2) {
    throw new DataScopeError('INVALID_CHANNEL_COUNT', '无法从 JSON 推断通道数量')
  }

  return firstRow.slice(1).map((_, index) => `ch${index + 1}`)
}

function extractTable(
  file: JsonDatasetFile,
  matrix: number[][],
  channelNames: string[]
): { timestamps: number[]; columns: number[][] } {
  const firstRow = matrix[0]
  if (!Array.isArray(firstRow) || firstRow.length === 0) {
    throw new DataScopeError('INVALID_FORMAT', 'JSON 数据行无效')
  }

  const rowMajorWithTimestamp = firstRow.length === channelNames.length + 1
  const channelMajor = matrix.length === channelNames.length && firstRow.every((value) => typeof value === 'number')

  if (rowMajorWithTimestamp) {
    const timestamps: number[] = []
    const columns: number[][] = channelNames.map(() => [])

    matrix.forEach((row, index) => {
      if (!Array.isArray(row) || row.length !== channelNames.length + 1) {
        throw new DataScopeError(
          'COLUMN_MISMATCH',
          `第 ${index + 1} 行列数不正确`,
          { row: index + 1 }
        )
      }
      timestamps.push(requireFinite(row[0], index + 1, 1))
      for (let column = 0; column < channelNames.length; column += 1) {
        columns[column].push(requireFinite(row[column + 1], index + 1, column + 2))
      }
    })

    return { timestamps, columns }
  }

  if (channelMajor) {
    const columns = matrix.map((column, columnIndex) => {
      if (!Array.isArray(column)) {
        throw new DataScopeError('INVALID_FORMAT', `通道 ${columnIndex + 1} 不是数组`)
      }
      return column.map((value, row) => requireFinite(value, row + 1, columnIndex + 1))
    })

    const sampleCount = columns[0]?.length ?? 0
    if (columns.some((column) => column.length !== sampleCount)) {
      throw new DataScopeError('COLUMN_MISMATCH', '各通道采样点数不一致')
    }

    const startTime = file.startTime ?? 0
    const sampleRate = file.sampleRate ?? 1000
    const timestamps = Array.from({ length: sampleCount }, (_, index) => startTime + index / sampleRate)
    return { timestamps, columns }
  }

  throw new DataScopeError(
    'INVALID_FORMAT',
    'JSON 数据应为行主序 [timestamp, ch1, ...] 或通道主序 samples[channel][sample]'
  )
}

function requireFinite(value: unknown, row: number, column: number): number {
  if (typeof value === 'string') {
    return parseNumericCell(value, row, column)
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new DataScopeError('NON_NUMERIC', `第 ${row} 行第 ${column} 列不是数字`, { row, column })
  }
  if (!Number.isFinite(value)) {
    throw new DataScopeError('NAN_OR_INFINITY', `第 ${row} 行第 ${column} 列包含 Infinity`, {
      row,
      column
    })
  }
  return value
}

function fileNameFromPath(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  const fileName = parts[parts.length - 1] || 'dataset'
  return fileName.replace(/\.json$/i, '')
}
