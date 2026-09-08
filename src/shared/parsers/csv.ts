import { DataScopeError } from '../errors'
import type { Dataset } from '../types/dataset'
import {
  buildDataset,
  detectDelimiter,
  isFiniteNumber,
  isHeaderCell,
  parseNumericCell,
  splitDelimitedLine,
  type ParsedTable
} from './common'
import { parseTimestampCell } from './timestamp'

export function parseCSV(content: string, sourcePath = 'memory.csv'): Dataset {
  return parseDelimited(content, sourcePath, 'csv')
}

export function parseTXT(content: string, sourcePath = 'memory.txt'): Dataset {
  return parseDelimited(content, sourcePath, 'txt')
}

function parseDelimited(
  content: string,
  sourcePath: string,
  format: 'csv' | 'txt'
): Dataset {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rawLines = normalized.split('\n')
  const lines = rawLines.map((line) => line.trimEnd()).filter((line, index, array) => {
    if (line.trim() !== '') return true
    return index < array.length - 1 && array.slice(index + 1).some((item) => item.trim() !== '')
  })

  const nonEmpty = lines.filter((line) => line.trim() !== '')
  if (nonEmpty.length === 0) {
    throw new DataScopeError('FILE_EMPTY', '文件为空，无法导入')
  }

  const delimiter = detectDelimiter(nonEmpty[0])
  const firstCells = splitDelimitedLine(nonEmpty[0], delimiter)
  if (firstCells.length < 2) {
    throw new DataScopeError('INVALID_CHANNEL_COUNT', '至少需要时间戳列和 1 个通道列')
  }

  const hasHeader = firstCells.every((cell) => isHeaderCell(cell)) || looksLikeHeader(firstCells)
  if (!hasHeader) {
    throw new DataScopeError(
      'HEADER_MISSING',
      '缺少表头。期望格式: timestamp,ch1,ch2,...'
    )
  }

  const headerCells = firstCells
  const channelNames = headerCells.slice(1).map((name, index) => name || `ch${index + 1}`)
  if (channelNames.length === 0) {
    throw new DataScopeError('INVALID_CHANNEL_COUNT', '未检测到通道列')
  }

  const timestamps: number[] = []
  const columns: number[][] = channelNames.map(() => [])
  const dataLines = nonEmpty.slice(1)

  if (dataLines.length === 0) {
    throw new DataScopeError('FILE_EMPTY', '仅有表头，没有采样数据')
  }

  dataLines.forEach((line, offset) => {
    const rowNumber = offset + 2
    const cells = splitDelimitedLine(line, delimiter)
    if (cells.length !== headerCells.length) {
      throw new DataScopeError(
        'COLUMN_MISMATCH',
        `第 ${rowNumber} 行列数与表头不一致，期望 ${headerCells.length} 列，实际 ${cells.length} 列`,
        { row: rowNumber, expected: headerCells.length, actual: cells.length }
      )
    }

    timestamps.push(parseTimestampCell(cells[0], rowNumber, 1))
    for (let column = 1; column < cells.length; column += 1) {
      columns[column - 1].push(parseNumericCell(cells[column], rowNumber, column + 1))
    }
  })

  const table: ParsedTable = {
    channelNames,
    timestamps,
    columns
  }

  const name = fileNameFromPath(sourcePath)
  return buildDataset({
    name,
    table,
    sourcePath,
    sourceFormat: format,
    fileSize: new TextEncoder().encode(content).length,
    encoding: 'utf-8'
  })
}

function looksLikeHeader(cells: string[]): boolean {
  const [first, ...rest] = cells
  const firstIsHeader = first.toLowerCase() === 'timestamp' || first.toLowerCase() === 'time' || !isFiniteNumber(first)
  const restLookNamed = rest.some((cell) => !isFiniteNumber(cell))
  return firstIsHeader && restLookNamed
}

function fileNameFromPath(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  const fileName = parts[parts.length - 1] || 'dataset'
  return fileName.replace(/\.(csv|txt|json)$/i, '')
}
