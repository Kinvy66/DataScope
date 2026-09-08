export function calculateMin(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate min of an empty series')
  }

  let min = values[0]
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] < min) {
      min = values[i]
    }
  }
  return min
}

export function calculateMax(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate max of an empty series')
  }

  let max = values[0]
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > max) {
      max = values[i]
    }
  }
  return max
}

export function calculateMean(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate mean of an empty series')
  }

  let sum = 0
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i]
  }
  return sum / values.length
}

export function calculateRMS(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate RMS of an empty series')
  }

  let squareSum = 0
  for (let i = 0; i < values.length; i += 1) {
    squareSum += values[i] * values[i]
  }
  return Math.sqrt(squareSum / values.length)
}

export function calculatePeakToPeak(values: number[]): number {
  return calculateMax(values) - calculateMin(values)
}

export interface ChannelStats {
  min: number
  max: number
  mean: number
  rms: number
  peakToPeak: number
}

export function calculateChannelStatistics(values: number[]): ChannelStats {
  if (values.length === 0) {
    throw new Error('Cannot calculate statistics of an empty series')
  }

  let min = values[0]
  let max = values[0]
  let sum = 0
  let squareSum = 0

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i]
    if (value < min) min = value
    if (value > max) max = value
    sum += value
    squareSum += value * value
  }

  return {
    min,
    max,
    mean: sum / values.length,
    rms: Math.sqrt(squareSum / values.length),
    peakToPeak: max - min
  }
}
