import { DataScopeError } from '../errors'
import { resolveSampleRange, type SampleRange } from '../algorithms/statistics'
import type { Channel, Dataset } from '../types/dataset'
import { isExportFormat, type ExportFormat, type ExportRequest } from '../types/export'

export const EXPORT_ROW_CHUNK = 4096

export interface ResolvedExport {
  format: ExportFormat
  channels: Channel[]
  range: SampleRange
  sampleRate: number
  startTime: number
  name: string
}

export function resolveExportPlan(
  dataset: Dataset,
  request: Pick<ExportRequest, 'format' | 'channelIds' | 'startIndex' | 'endIndex'>
): ResolvedExport {
  if (!isExportFormat(request.format)) {
    throw new DataScopeError('VALIDATION_ERROR', `不支持的导出格式: ${String(request.format)}`)
  }
  if (request.channelIds.length === 0) {
    throw new DataScopeError('VALIDATION_ERROR', '请至少选择一个通道进行导出')
  }

  const channels: Channel[] = []
  const seen = new Set<string>()
  for (const channelId of request.channelIds) {
    if (seen.has(channelId)) continue
    const channel = dataset.channels.find((item) => item.id === channelId)
    if (!channel) {
      throw new DataScopeError('VALIDATION_ERROR', `通道不存在: ${channelId}`)
    }
    seen.add(channelId)
    channels.push(channel)
  }

  let range: SampleRange
  try {
    range = resolveSampleRange(dataset.sampleCount, request.startIndex, request.endIndex)
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出区间无效'
    throw new DataScopeError('VALIDATION_ERROR', message)
  }

  return {
    format: request.format,
    channels,
    range,
    sampleRate: dataset.sampleRate,
    startTime: dataset.startTime + range.startIndex / dataset.sampleRate,
    name: dataset.name
  }
}

export function timestampAt(dataset: Dataset, sampleIndex: number): number {
  return dataset.startTime + sampleIndex / dataset.sampleRate
}

export function formatExportNumber(value: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new DataScopeError('NON_NUMERIC', '导出数据包含非数字')
  }
  if (!Number.isFinite(value)) {
    throw new DataScopeError('NAN_OR_INFINITY', '导出数据包含 Infinity')
  }
  return String(value)
}

export function sanitizeExportChannelName(name: string, index: number): string {
  const trimmed = name.trim() || `ch${index + 1}`
  return trimmed.replace(/[,\t;]/g, '_')
}

export function formatDelimitedHeader(channelNames: string[], delimiter: string): string {
  const names = channelNames.map((name, index) =>
    escapeDelimitedCell(sanitizeExportChannelName(name, index), delimiter)
  )
  return ['timestamp', ...names].join(delimiter)
}

export function formatDelimitedRow(
  timestamp: number,
  values: number[],
  delimiter: string
): string {
  const cells = [formatExportNumber(timestamp), ...values.map((value) => formatExportNumber(value))]
  return cells.map((cell) => escapeDelimitedCell(cell, delimiter)).join(delimiter)
}

export function delimiterFor(format: ExportFormat): string {
  if (format === 'txt') return '\t'
  if (format === 'csv') return ','
  throw new DataScopeError('VALIDATION_ERROR', `分隔文本导出不支持格式: ${format}`)
}

export function serializeExport(
  dataset: Dataset,
  request: Pick<ExportRequest, 'format' | 'channelIds' | 'startIndex' | 'endIndex'>
): string {
  const plan = resolveExportPlan(dataset, request)
  if (plan.format === 'dsb') {
    throw new DataScopeError('VALIDATION_ERROR', '二进制导出请使用 encodeDsb')
  }
  if (plan.format === 'json') {
    return serializeJsonExport(dataset, plan)
  }
  const delimiter = delimiterFor(plan.format)
  const header = formatDelimitedHeader(
    plan.channels.map((channel) => channel.name),
    delimiter
  )
  const lines = [header]
  for (let index = plan.range.startIndex; index <= plan.range.endIndex; index += 1) {
    const values = plan.channels.map((channel) => sampleAt(dataset, channel, index))
    lines.push(formatDelimitedRow(timestampAt(dataset, index), values, delimiter))
  }
  return `${lines.join('\n')}\n`
}

function serializeJsonExport(dataset: Dataset, plan: ResolvedExport): string {
  const samples: number[][] = []
  for (let index = plan.range.startIndex; index <= plan.range.endIndex; index += 1) {
    const row = [timestampAt(dataset, index)]
    for (const channel of plan.channels) {
      const value = sampleAt(dataset, channel, index)
      formatExportNumber(value)
      row.push(value)
    }
    samples.push(row)
  }
  return JSON.stringify({
    name: plan.name,
    sampleRate: plan.sampleRate,
    startTime: plan.startTime,
    channelNames: plan.channels.map((channel) => channel.name),
    samples
  })
}

export function sampleAt(dataset: Dataset, channel: Channel, sampleIndex: number): number {
  const column = dataset.samples[channel.index]
  const value = column?.[sampleIndex]
  if (value === undefined) {
    throw new DataScopeError('VALIDATION_ERROR', `通道数据不存在: ${channel.name}`)
  }
  return value
}

function escapeDelimitedCell(value: string, delimiter: string): string {
  if (
    value.includes('"') ||
    value.includes(delimiter) ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
