import { applyFilter, describeFilter, validateFilterSpec } from '../algorithms/filter'
import { DataScopeError } from '../errors'
import { createId } from '../parsers/common'
import type { Dataset } from '../types/dataset'
import type { FilterRequest, FilterSpec } from '../types/filter'

export function applyFilterToDataset(dataset: Dataset, request: FilterRequest): Dataset {
  const spec = prepareFilter(dataset, request)
  const samples = dataset.channels.map((channel) => mapFilteredChannel(dataset, channel, spec, request))
  return buildFilteredDataset(dataset, request, spec, samples)
}

export async function applyFilterToDatasetAsync(
  dataset: Dataset,
  request: FilterRequest,
  onChannel?: (index: number, total: number) => Promise<void>
): Promise<Dataset> {
  const spec = prepareFilter(dataset, request)
  const samples: number[][] = []
  for (let index = 0; index < dataset.channels.length; index += 1) {
    const channel = dataset.channels[index]
    if (!channel) continue
    await onChannel?.(index, dataset.channels.length)
    samples.push(mapFilteredChannel(dataset, channel, spec, request))
  }
  return buildFilteredDataset(dataset, request, spec, samples)
}

function prepareFilter(dataset: Dataset, request: FilterRequest): FilterSpec {
  if (request.channelIds.length === 0) {
    throw new DataScopeError('VALIDATION_ERROR', '请至少选择一个通道进行滤波')
  }

  const spec = validateFilterSpec(request, dataset.sampleRate)
  for (const channelId of request.channelIds) {
    if (!dataset.channels.some((channel) => channel.id === channelId)) {
      throw new DataScopeError('VALIDATION_ERROR', `通道不存在: ${channelId}`)
    }
  }
  return spec
}

function mapFilteredChannel(
  dataset: Dataset,
  channel: Dataset['channels'][number],
  spec: FilterSpec,
  request: FilterRequest
): number[] {
  const values = dataset.samples[channel.index]
  if (!values) {
    throw new DataScopeError('VALIDATION_ERROR', `通道数据不存在: ${channel.name}`)
  }
  if (!request.channelIds.includes(channel.id)) {
    return values.slice()
  }
  return applyFilter(values, dataset.sampleRate, spec)
}

function buildFilteredDataset(
  dataset: Dataset,
  request: FilterRequest,
  spec: FilterSpec,
  samples: number[][]
): Dataset {
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
