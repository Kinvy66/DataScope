import { DataScopeError } from '../errors'
import { isFiniteNumber, parseNumericCell } from './common'

const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|[+-]\d{2}:?\d{2})?$/

export function parseDateTimeToSeconds(value: string): number | null {
  const trimmed = value.trim()
  const match = DATE_TIME_PATTERN.exec(trimmed)
  if (!match) {
    const parsed = Date.parse(trimmed)
    return Number.isNaN(parsed) ? null : parsed / 1000
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const wholeSeconds = Number(match[6])
  const fraction = match[7] ? Number(`0.${match[7]}`) : 0
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(wholeSeconds) ||
    !Number.isFinite(fraction)
  ) {
    return null
  }

  const utcMillis = Date.UTC(year, month - 1, day, hour, minute, wholeSeconds, 0)
  if (Number.isNaN(utcMillis)) {
    return null
  }
  return utcMillis / 1000 + fraction
}

export function parseTimestampCell(value: string, row: number, column: number): number {
  const trimmed = value.trim()
  if (isFiniteNumber(trimmed)) {
    return parseNumericCell(trimmed, row, column)
  }

  const seconds = parseDateTimeToSeconds(trimmed)
  if (seconds === null) {
    throw new DataScopeError(
      'INVALID_TIMESTAMP',
      `第 ${row} 行第 ${column} 列不是有效时间戳: ${trimmed}`,
      { row, column }
    )
  }
  return seconds
}
