export interface ChannelStats {
  min: number
  max: number
  mean: number
  median: number
  rms: number
  stdDev: number
  peakToPeak: number
  sampleCount: number
}

export interface SampleRange {
  startIndex: number
  endIndex: number
  sampleCount: number
}

export function resolveSampleRange(
  sampleCount: number,
  startIndex: number,
  endIndex: number
): SampleRange {
  if (!(sampleCount > 0) || !Number.isFinite(sampleCount)) {
    throw new Error('Cannot analyze an empty series')
  }

  const start = Math.floor(startIndex)
  const end = Math.floor(endIndex)

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new Error('Analysis range is not a finite number')
  }
  if (start < 0 || end < 0) {
    throw new Error('Analysis range cannot be negative')
  }
  if (start >= sampleCount || end >= sampleCount) {
    throw new Error(`Analysis range is outside 0..${sampleCount - 1}`)
  }
  if (start > end) {
    throw new Error('Analysis start index must be less than or equal to end index')
  }

  return {
    startIndex: start,
    endIndex: end,
    sampleCount: end - start + 1
  }
}

export function calculateMin(values: number[]): number {
  return calculateChannelStatistics(values).min
}

export function calculateMax(values: number[]): number {
  return calculateChannelStatistics(values).max
}

export function calculateMean(values: number[]): number {
  return calculateChannelStatistics(values).mean
}

export function calculateMedian(values: number[]): number {
  return calculateChannelStatistics(values).median
}

export function calculateRMS(values: number[]): number {
  return calculateChannelStatistics(values).rms
}

export function calculateStdDev(values: number[]): number {
  return calculateChannelStatistics(values).stdDev
}

export function calculatePeakToPeak(values: number[]): number {
  return calculateChannelStatistics(values).peakToPeak
}

export function calculateChannelStatistics(
  values: number[],
  startIndex = 0,
  endIndex = Math.max(values.length - 1, 0)
): ChannelStats {
  const range = resolveSampleRange(values.length, startIndex, endIndex)
  const first = values[range.startIndex]
  if (!Number.isFinite(first)) {
    throw new Error('Cannot calculate statistics of non-finite samples')
  }

  let min = first
  let max = first
  let sum = 0
  let squareSum = 0
  const window: number[] = new Array(range.sampleCount)

  for (let i = 0; i < range.sampleCount; i += 1) {
    const value = values[range.startIndex + i]
    if (!Number.isFinite(value)) {
      throw new Error('Cannot calculate statistics of non-finite samples')
    }
    window[i] = value
    if (value < min) min = value
    if (value > max) max = value
    sum += value
    squareSum += value * value
  }

  const mean = sum / range.sampleCount
  const rms = Math.sqrt(squareSum / range.sampleCount)
  const variance = Math.max(0, squareSum / range.sampleCount - mean * mean)
  const stdDev = Math.sqrt(variance)
  window.sort((left, right) => left - right)

  return {
    min,
    max,
    mean,
    median: medianOfSorted(window),
    rms,
    stdDev,
    peakToPeak: max - min,
    sampleCount: range.sampleCount
  }
}

function medianOfSorted(sorted: number[]): number {
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) {
    return sorted[middle]
  }
  return (sorted[middle - 1] + sorted[middle]) / 2
}
