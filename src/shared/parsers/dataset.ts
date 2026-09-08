import type { Dataset, DatasetInfo } from '../types/dataset'

export function toDatasetInfo(dataset: Dataset): DatasetInfo {
  const duration =
    dataset.sampleCount <= 1 ? 0 : (dataset.sampleCount - 1) / dataset.sampleRate

  return {
    id: dataset.id,
    name: dataset.name,
    sampleRate: dataset.sampleRate,
    channelCount: dataset.channelCount,
    sampleCount: dataset.sampleCount,
    startTime: dataset.startTime,
    duration,
    channels: dataset.channels.map((channel) => ({ ...channel })),
    markers: dataset.markers.map((marker) => ({ ...marker })),
    metadata: { ...dataset.metadata }
  }
}

export function validateDataset(dataset: Dataset): void {
  if (!dataset.id || !dataset.name) {
    throw new Error('Dataset 缺少 id 或 name')
  }
  if (!(dataset.sampleRate > 0)) {
    throw new Error('sampleRate 必须大于 0')
  }
  if (dataset.channelCount !== dataset.channels.length) {
    throw new Error('channelCount 与 channels 长度不一致')
  }
  if (dataset.samples.length !== dataset.channelCount) {
    throw new Error('samples 通道数与 channelCount 不一致')
  }
  for (const column of dataset.samples) {
    if (column.length !== dataset.sampleCount) {
      throw new Error('通道采样点数与 sampleCount 不一致')
    }
  }
}
