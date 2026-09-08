import { applyFilter, describeFilter, validateFilterSpec } from '../algorithms/filter'
import { DataScopeError } from '../errors'
import { createId } from '../parsers/common'
import type { Dataset } from '../types/dataset'
import type { FilterRequest } from '../types/filter'

export function applyFilterToDataset(dataset: Dataset, request: FilterRequest): Dataset {
  if (request.channelIds.length === 0) {
    throw new DataScopeError('VALIDATION_ERROR', '请至少选择一个通道进行滤波')
  }

  const spec = validateFilterSpec(request, dataset.sampleRate)
  for (const channelId of request.channelIds) {
    if (!dataset.channels.some((channel) => channel.id === channelId)) {
      throw new DataScopeError('VALIDATION_ERROR', `通道不存在: ${channelId}`)
    }
  }

  const selected = new Set(request.channelIds)
  const samples = dataset.channels.map((channel) => {
    const values = dataset.samples[channel.index]
    if (!values) {
      throw new DataScopeError('VALIDATION_ERROR', `通道数据不存在: ${channel.name}`)
    }
    if (!selected.has(channel.id)) {
      return values.slice()
    }
    return applyFilter(values, dataset.sampleRate, spec)
  })

  const label = describeFilter(spec)
  const name = (request.name ?? `${dataset.name} · ${label}`).trim()
  if (!name) {
    throw new DataScopeError('VALIDATION_ERROR', '滤波结果名称不能为空')
  }

  return {
    id: createId('ds'),
    name,
    sampleRate: dataset.sampleRate,
    channelCount: dataset.channelCount,
    sampleCount: dataset.sampleCount,
    startTime: dataset.startTime,
    channels: dataset.channels.map((channel) => ({ ...channel })),
    samples,
    markers: dataset.markers.map((marker) => ({ ...marker })),
    metadata: {
      sourcePath: `${name}.json`,
      sourceFormat: 'json',
      importedAt: Date.now(),
      fileSize: 0,
      encoding: 'utf-8'
    }
  }
}
