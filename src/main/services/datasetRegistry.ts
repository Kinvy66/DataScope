import { downsampleMinMax } from '@shared/algorithms/downsample'
import { calculateChannelStatistics } from '@shared/algorithms/statistics'
import { DataScopeError } from '@shared/errors'
import { toDatasetInfo } from '@shared/parsers/dataset'
import type {
  ChannelStatistics,
  Dataset,
  DatasetInfo,
  Marker,
  ViewportData,
  ViewportRequest
} from '@shared/types/dataset'

class DatasetRegistry {
  private datasets = new Map<string, Dataset>()

  clear(): void {
    this.datasets.clear()
  }

  add(dataset: Dataset): DatasetInfo {
    this.datasets.set(dataset.id, dataset)
    return toDatasetInfo(dataset)
  }

  remove(datasetId: string): void {
    this.datasets.delete(datasetId)
  }

  rename(datasetId: string, name: string): DatasetInfo {
    const dataset = this.get(datasetId)
    dataset.name = name
    return toDatasetInfo(dataset)
  }

  setMarkers(datasetId: string, markers: Marker[]): DatasetInfo {
    const dataset = this.get(datasetId)
    dataset.markers = markers
    return toDatasetInfo(dataset)
  }

  get(datasetId: string): Dataset {
    const dataset = this.datasets.get(datasetId)
    if (!dataset) {
      throw new DataScopeError('FILE_NOT_FOUND', `未找到数据集: ${datasetId}`)
    }
    return dataset
  }

  getInfo(datasetId: string): DatasetInfo {
    return toDatasetInfo(this.get(datasetId))
  }

  list(): DatasetInfo[] {
    return Array.from(this.datasets.values()).map((dataset) => toDatasetInfo(dataset))
  }

  getStatistics(datasetId: string): ChannelStatistics[] {
    const dataset = this.get(datasetId)
    return dataset.channels.map((channel, index) => {
      const stats = calculateChannelStatistics(dataset.samples[index] ?? [])
      return {
        channelId: channel.id,
        channelName: channel.name,
        ...stats
      }
    })
  }

  getViewport(request: ViewportRequest): ViewportData {
    const dataset = this.get(request.datasetId)
    const pixelWidth = Math.max(1, Math.floor(request.pixelWidth))
    const startIndex = Math.max(0, Math.floor(request.startIndex))
    const endIndex = Math.min(dataset.sampleCount - 1, Math.ceil(request.endIndex))

    const traces = request.channelIds.map((channelId) => {
      const channel = dataset.channels.find((item) => item.id === channelId)
      if (!channel) {
        throw new DataScopeError('VALIDATION_ERROR', `通道不存在: ${channelId}`)
      }
      const values = dataset.samples[channel.index] ?? []
      const buckets = downsampleMinMax(values, startIndex, endIndex, pixelWidth)
      return {
        channelId,
        mins: buckets.map((bucket) => bucket.min),
        maxs: buckets.map((bucket) => bucket.max)
      }
    })

    return {
      datasetId: dataset.id,
      startIndex,
      endIndex,
      pixelWidth,
      traces
    }
  }
}

export const datasetRegistry = new DatasetRegistry()
