import type { WindowType } from '../algorithms/fft'

export interface SpectrumRequest {
  datasetId: string
  channelIds: string[]
  startIndex: number
  endIndex: number
  fftSize: number
  window: WindowType
}

export interface ChannelSpectrum {
  channelId: string
  channelName: string
  peakFrequency: number
  peakMagnitude: number
  peakPower: number
  usedSamples: number
  frequencies: number[]
  magnitudes: number[]
  powers: number[]
}

export interface SpectrumResult {
  id: string
  datasetId: string
  datasetName: string
  sampleRate: number
  startIndex: number
  endIndex: number
  fftSize: number
  window: WindowType
  frequencyResolution: number
  nyquist: number
  computedAt: number
  channels: ChannelSpectrum[]
  outputPath: string | null
}
