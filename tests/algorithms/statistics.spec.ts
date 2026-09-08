import { describe, expect, it } from 'vitest'
import {
  calculateChannelStatistics,
  calculateMedian,
  calculateStdDev,
  resolveSampleRange
} from '@shared/algorithms/statistics'

describe('resolveSampleRange', () => {
  it('accepts a closed inclusive window', () => {
    expect(resolveSampleRange(10, 2, 5)).toEqual({
      startIndex: 2,
      endIndex: 5,
      sampleCount: 4
    })
  })

  it('rejects empty input, inverted range and out-of-bounds indices', () => {
    expect(() => resolveSampleRange(0, 0, 0)).toThrow(/empty/)
    expect(() => resolveSampleRange(4, 3, 1)).toThrow(/start index/)
    expect(() => resolveSampleRange(4, -1, 1)).toThrow(/negative/)
    expect(() => resolveSampleRange(4, 0, 4)).toThrow(/outside/)
  })
})

describe('calculateChannelStatistics', () => {
  it('calculates mean, rms, peak-to-peak, median and stddev', () => {
    const values = [1, 2, 3, 4]
    const stats = calculateChannelStatistics(values)
    expect(stats.min).toBe(1)
    expect(stats.max).toBe(4)
    expect(stats.mean).toBe(2.5)
    expect(stats.median).toBe(2.5)
    expect(stats.peakToPeak).toBe(3)
    expect(stats.sampleCount).toBe(4)
    expect(stats.rms).toBeCloseTo(Math.sqrt(30 / 4))
    expect(stats.stdDev).toBeCloseTo(Math.sqrt(1.25))
  })

  it('uses the middle value as the odd-length median', () => {
    expect(calculateMedian([9, 1, 5])).toBe(5)
  })

  it('returns zero stddev for a constant series', () => {
    expect(calculateStdDev([3, 3, 3, 3])).toBe(0)
  })

  it('analyzes a sub-range without copying neighboring samples into the result', () => {
    const stats = calculateChannelStatistics([10, 20, 30, 40, 50], 1, 3)
    expect(stats.min).toBe(20)
    expect(stats.max).toBe(40)
    expect(stats.mean).toBe(30)
    expect(stats.median).toBe(30)
    expect(stats.sampleCount).toBe(3)
  })

  it('rejects empty and non-finite input', () => {
    expect(() => calculateChannelStatistics([])).toThrow()
    expect(() => calculateChannelStatistics([1, Number.NaN, 3])).toThrow(/non-finite/)
  })

  it('approaches 1/sqrt(2) RMS for a unit sine without DC', () => {
    const values = Array.from({ length: 4000 }, (_, i) => Math.sin((2 * Math.PI * i) / 200))
    const stats = calculateChannelStatistics(values)
    expect(stats.mean).toBeCloseTo(0, 5)
    expect(stats.rms).toBeCloseTo(Math.SQRT1_2, 3)
  })
})
