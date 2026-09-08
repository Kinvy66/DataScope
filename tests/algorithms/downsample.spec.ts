import { describe, expect, it } from 'vitest'
import { downsampleMinMax } from '@shared/algorithms/downsample'
import { calculateChannelStatistics, calculateMean, calculateRMS } from '@shared/algorithms/statistics'

describe('statistics', () => {
  it('calculates mean, rms and peak-to-peak', () => {
    const values = [1, 2, 3, 4]
    const stats = calculateChannelStatistics(values)
    expect(stats.min).toBe(1)
    expect(stats.max).toBe(4)
    expect(stats.mean).toBe(calculateMean(values))
    expect(stats.rms).toBeCloseTo(calculateRMS(values))
    expect(stats.peakToPeak).toBe(3)
  })
})

describe('min-max downsampling', () => {
  it('keeps peaks inside each pixel bucket', () => {
    const values = [0, 10, -5, 3, 8, 1]
    const buckets = downsampleMinMax(values, 0, values.length - 1, 3)
    expect(buckets.length).toBe(3)
    expect(buckets[0].max).toBeGreaterThanOrEqual(buckets[0].min)
    expect(Math.max(...buckets.map((bucket) => bucket.max))).toBe(10)
    expect(Math.min(...buckets.map((bucket) => bucket.min))).toBe(-5)
  })

  it('downsamples 32 x 1,000,000 samples to viewport width', () => {
    const sampleCount = 1_000_000
    const width = 1600
    const started = Date.now()

    for (let channel = 0; channel < 32; channel += 1) {
      const values = new Array<number>(sampleCount)
      for (let i = 0; i < sampleCount; i += 1) {
        values[i] = Math.sin(i / 200 + channel) + (i % 5000 === 0 ? 8 : 0)
      }
      const buckets = downsampleMinMax(values, 0, sampleCount - 1, width)
      expect(buckets.length).toBeLessThanOrEqual(width)
      expect(buckets.length).toBeGreaterThan(0)
      expect(buckets[0]).toHaveProperty('min')
      expect(buckets[0]).toHaveProperty('max')
    }

    expect(Date.now() - started).toBeLessThan(20_000)
  })
})
