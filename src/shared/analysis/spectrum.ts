import { computeSpectrum, type WindowType } from '../algorithms/fft'
import { resolveSampleRange } from '../algorithms/statistics'
import { DataScopeError } from '../errors'
import { createId } from '../parsers/common'
import type { Dataset } from '../types/dataset'
import type { SpectrumRequest, SpectrumResult } from '../types/spectrum'

const WINDOWS: WindowType[] = ['rectangular', 'hann', 'hamming', 'blackman']

export function analyzeSpectrum(dataset: Dataset, request: SpectrumRequest): SpectrumResult {
  if (request.channelIds.length === 0) {
    throw new DataScopeError('VALIDATION_ERROR', '请至少选择一个通道进行频谱分析')
  }
  if (!WINDOWS.includes(request.window)) {
    throw new DataScopeError('VALIDATION_ERROR', `不支持的窗函数: ${request.window}`)
  }

  const range = (() => {
    try {
      return resolveSampleRange(dataset.sampleCount, request.startIndex, request.endIndex)
    } catch (error) {
      const message = error instanceof Error ? error.message : '分析区间无效'
      throw new DataScopeError('VALIDATION_ERROR', message)
    }
  })()

  const channels = request.channelIds.map((channelId) => {
    const channel = dataset.channels.find((item) => item.id === channelId)
    if (!channel) {
      throw new DataScopeError('VALIDATION_ERROR', `通道不存在: ${channelId}`)
    }
    const values = dataset.samples[channel.index]
    if (!values) {
      throw new DataScopeError('VALIDATION_ERROR', `通道数据不存在: ${channel.name}`)
    }

    let trace
    try {
      trace = computeSpectrum(values, dataset.sampleRate, {
        startIndex: range.startIndex,
        endIndex: range.endIndex,
        fftSize: request.fftSize,
        window: request.window
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'FFT 计算失败'
      throw new DataScopeError('VALIDATION_ERROR', message)
    }

    return {
      channelId: channel.id,
      channelName: channel.name,
      peakFrequency: trace.peakFrequency,
      peakMagnitude: trace.peakMagnitude,
      peakPower: trace.peakPower,
      usedSamples: trace.usedSamples,
      frequencies: trace.frequencies,
      magnitudes: trace.magnitudes,
      powers: trace.powers
    }
  })

  return {
    id: createId('spec'),
    datasetId: dataset.id,
    datasetName: dataset.name,
    sampleRate: dataset.sampleRate,
    startIndex: range.startIndex,
    endIndex: range.endIndex,
    fftSize: request.fftSize,
    window: request.window,
    frequencyResolution: dataset.sampleRate / request.fftSize,
    nyquist: dataset.sampleRate / 2,
    computedAt: Date.now(),
    channels,
    outputPath: null
  }
}
