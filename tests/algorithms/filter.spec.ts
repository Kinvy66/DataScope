import { describe, expect, it } from 'vitest'
import {
  applyFilter,
  describeFilter,
  nyquistHz,
  validateFilterSpec
} from '@shared/algorithms/filter'
import { DataScopeError } from '@shared/errors'
import type { FilterSpec } from '@shared/types/filter'

function sine(sampleRate: number, frequency: number, seconds: number, amplitude = 1, offset = 0): number[] {
  const count = Math.round(sampleRate * seconds)
  return Array.from(
    { length: count },
    (_, index) => offset + amplitude * Math.sin((2 * Math.PI * frequency * index) / sampleRate)
  )
}

function rms(values: number[], fromRatio = 0.5): number {
  const start = Math.floor(values.length * fromRatio)
  let sum = 0
  let count = 0
  for (let i = start; i < values.length; i += 1) {
    sum += values[i] * values[i]
    count += 1
  }
  return Math.sqrt(sum / Math.max(count, 1))
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const lowpass: FilterSpec = {
  kind: 'lowpass',
  cutoffHz: 40,
  lowHz: 10,
  highHz: 100,
  frequencyHz: 50,
  q: 30
}

describe('validateFilterSpec', () => {
  it('rejects cutoff at or above Nyquist', () => {
    expect(() => validateFilterSpec({ ...lowpass, cutoffHz: 500 }, 1000)).toThrow(DataScopeError)
    expect(() => validateFilterSpec({ ...lowpass, cutoffHz: 0 }, 1000)).toThrow(DataScopeError)
  })

  it('rejects bandpass with inverted edges', () => {
    expect(() =>
      validateFilterSpec({ ...lowpass, kind: 'bandpass', lowHz: 80, highHz: 20 }, 1000)
    ).toThrow(/下限必须小于上限/)
  })

  it('rejects invalid Q', () => {
    expect(() => validateFilterSpec({ ...lowpass, kind: 'notch', q: 0 }, 1000)).toThrow(DataScopeError)
  })
})

describe('applyFilter', () => {
  it('returns empty output for empty input', () => {
    expect(applyFilter([], 1000, lowpass)).toEqual([])
  })

  it('removes DC offset', () => {
    const values = sine(1000, 20, 1, 1, 3)
    const filtered = applyFilter(values, 1000, { ...lowpass, kind: 'dc-remove' })
    expect(Math.abs(mean(filtered))).toBeLessThan(1e-10)
    expect(rms(filtered)).toBeCloseTo(Math.SQRT1_2, 2)
  })

  it('low-pass keeps 10 Hz and attenuates 200 Hz', () => {
    const pass = applyFilter(sine(1000, 10, 2), 1000, lowpass)
    const stop = applyFilter(sine(1000, 200, 2), 1000, lowpass)
    expect(rms(pass)).toBeGreaterThan(0.55)
    expect(rms(stop)).toBeLessThan(0.08)
  })

  it('high-pass keeps 80 Hz and attenuates DC', () => {
    const spec: FilterSpec = { ...lowpass, kind: 'highpass', cutoffHz: 20 }
    const pass = applyFilter(sine(1000, 80, 2), 1000, spec)
    const stop = applyFilter(sine(1000, 80, 2, 1, 4), 1000, spec)
    expect(rms(pass)).toBeGreaterThan(0.5)
    expect(Math.abs(mean(stop))).toBeLessThan(0.05)
  })

  it('band-pass keeps 50 Hz and attenuates 8 Hz', () => {
    const spec: FilterSpec = { ...lowpass, kind: 'bandpass', lowHz: 30, highHz: 80 }
    const pass = applyFilter(sine(1000, 50, 2), 1000, spec)
    const stop = applyFilter(sine(1000, 8, 2), 1000, spec)
    expect(rms(pass)).toBeGreaterThan(0.4)
    expect(rms(stop)).toBeLessThan(0.12)
  })

  it('notch attenuates 50 Hz more than 20 Hz', () => {
    const spec: FilterSpec = { ...lowpass, kind: 'notch', frequencyHz: 50, q: 30 }
    const rejected = applyFilter(sine(1000, 50, 2), 1000, spec)
    const kept = applyFilter(sine(1000, 20, 2), 1000, spec)
    expect(rms(rejected)).toBeLessThan(0.12)
    expect(rms(kept)).toBeGreaterThan(0.5)
  })
})

describe('describeFilter', () => {
  it('labels each kind', () => {
    expect(describeFilter({ ...lowpass, kind: 'dc-remove' })).toBe('去直流')
    expect(describeFilter(lowpass)).toBe('低通 40Hz')
    expect(nyquistHz(1000)).toBe(500)
  })
})
