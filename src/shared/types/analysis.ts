import type { ChannelStatistics } from './dataset'

export interface AnalysisRequest {
  datasetId: string
  channelIds: string[]
  startIndex: number
  endIndex: number
}

export interface AnalysisResult {
  id: string
  datasetId: string
  datasetName: string
  sampleRate: number
  startIndex: number
  endIndex: number
  startTime: number
  endTime: number
  duration: number
  sampleCount: number
  computedAt: number
  channels: ChannelStatistics[]
  outputPath: string | null
}
