import { calculateChannelStatistics, resolveSampleRange } from '../algorithms/statistics'
import { DataScopeError } from '../errors'
import { createId } from '../parsers/common'
import type { AnalysisRequest, AnalysisResult } from '../types/analysis'
import type { ChannelStatistics, Dataset } from '../types/dataset'

export function analyzeTimeDomain(dataset: Dataset, request: AnalysisRequest): AnalysisResult {
  if (request.channelIds.length === 0) {
    throw new DataScopeError('VALIDATION_ERROR', '请至少选择一个通道进行分析')
  }

  const range = (() => {
    try {
      return resolveSampleRange(dataset.sampleCount, request.startIndex, request.endIndex)
    } catch (error) {
      const message = error instanceof Error ? error.message : '分析区间无效'
      throw new DataScopeError('VALIDATION_ERROR', message)
    }
  })()

  const selected = request.channelIds.map((channelId) => {
    const channel = dataset.channels.find((item) => item.id === channelId)
    if (!channel) {
      throw new DataScopeError('VALIDATION_ERROR', `通道不存在: ${channelId}`)
    }
    const values = dataset.samples[channel.index]
    if (!values) {
      throw new DataScopeError('VALIDATION_ERROR', `通道数据不存在: ${channel.name}`)
    }

    let stats
    try {
      stats = calculateChannelStatistics(values, range.startIndex, range.endIndex)
    } catch (error) {
      const message = error instanceof Error ? error.message : '统计分析失败'
      throw new DataScopeError('NAN_OR_INFINITY', message)
    }

    const row: ChannelStatistics = {
      channelId: channel.id,
      channelName: channel.name,
      ...stats
    }
    return row
  })

  const startTime = dataset.startTime + range.startIndex / dataset.sampleRate
  const endTime = dataset.startTime + range.endIndex / dataset.sampleRate

  return {
    id: createId('anl'),
    datasetId: dataset.id,
    datasetName: dataset.name,
    sampleRate: dataset.sampleRate,
    startIndex: range.startIndex,
    endIndex: range.endIndex,
    startTime,
    endTime,
    duration: range.sampleCount <= 1 ? 0 : (range.sampleCount - 1) / dataset.sampleRate,
    sampleCount: range.sampleCount,
    computedAt: Date.now(),
    channels: selected,
    outputPath: null
  }
}
