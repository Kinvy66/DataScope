export type SourceFormat = 'csv' | 'txt' | 'json'

export interface Channel {
  id: string
  name: string
  unit: string
  color: string
  visible: boolean
  index: number
}

export interface Marker {
  id: string
  name: string
  sampleIndex: number
  time: number
  channelId?: string
  color: string
  note: string
}

export interface DatasetMetadata {
  sourcePath: string
  sourceFormat: SourceFormat
  importedAt: number
  fileSize: number
  encoding: string
}

export interface Dataset {
  id: string
  name: string
  sampleRate: number
  channelCount: number
  sampleCount: number
  startTime: number
  channels: Channel[]
  samples: number[][]
  markers: Marker[]
  metadata: DatasetMetadata
}

export interface DatasetInfo {
  id: string
  name: string
  sampleRate: number
  channelCount: number
  sampleCount: number
  startTime: number
  duration: number
  channels: Channel[]
  markers: Marker[]
  metadata: DatasetMetadata
}

export interface ChannelStatistics {
  channelId: string
  channelName: string
  min: number
  max: number
  mean: number
  median: number
  rms: number
  stdDev: number
  peakToPeak: number
  sampleCount: number
}

export interface ViewportRequest {
  datasetId: string
  channelIds: string[]
  startIndex: number
  endIndex: number
  pixelWidth: number
}

export interface ChannelTrace {
  channelId: string
  mins: number[]
  maxs: number[]
}

export interface ViewportData {
  datasetId: string
  startIndex: number
  endIndex: number
  pixelWidth: number
  traces: ChannelTrace[]
}
