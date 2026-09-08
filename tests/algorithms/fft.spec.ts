import { describe, expect, it } from 'vitest'
import {
  computeSpectrum,
  createWindow,
  defaultFftSize,
  fftRadix2,
  isPowerOfTwo,
  nextPowerOfTwo
} from '@shared/algorithms/fft'

function cosine(length: number, cycles: number, amplitude = 1): number[] {
  return Array.from({ length }, (_, n) => amplitude * Math.cos((2 * Math.PI * cycles * n) / length))
}

describe('FFT helpers', () => {
  it('detects powers of two', () => {
    expect(isPowerOfTwo(1024)).toBe(true)
    expect(isPowerOfTwo(1000)).toBe(false)
    expect(nextPowerOfTwo(1000)).toBe(1024)
    expect(defaultFftSize(3000)).toBe(2048)
    expect(defaultFftSize(100)).toBe(256)
  })

  it('builds a rectangular window that sums to N', () => {
    const window = createWindow(8, 'rectangular')
    expect(window).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
  })
})

describe('fftRadix2', () => {
  it('places DC energy in bin 0', () => {
    const real = Float64Array.from([3, 3, 3, 3, 3, 3, 3, 3])
    const imag = new Float64Array(8)
    fftRadix2(real, imag)
    expect(Math.hypot(real[0], imag[0])).toBeCloseTo(24)
    for (let k = 1; k < 8; k += 1) {
      expect(Math.hypot(real[k], imag[k])).toBeLessThan(1e-10)
    }
  })
})

describe('computeSpectrum', () => {
  it('finds the exact bin frequency and amplitude of a cosine', () => {
    const fftSize = 1024
    const values = cosine(fftSize, 64, 2)
    const spectrum = computeSpectrum(values, fftSize, {
      startIndex: 0,
      endIndex: fftSize - 1,
      fftSize,
      window: 'rectangular'
    })

    expect(spectrum.peakFrequency).toBe(64)
    expect(spectrum.peakMagnitude).toBeCloseTo(2, 6)
    expect(spectrum.frequencyResolution).toBe(1)
    expect(spectrum.nyquist).toBe(512)
    expect(spectrum.frequencies[0]).toBe(0)
    expect(spectrum.frequencies.at(-1)).toBe(512)
  })

  it('separates two exact-bin tones', () => {
    const fftSize = 1024
    const values = cosine(fftSize, 32, 1).map((value, index) => value + cosine(fftSize, 96, 1)[index])
    const spectrum = computeSpectrum(values, fftSize, {
      startIndex: 0,
      endIndex: fftSize - 1,
      fftSize,
      window: 'rectangular'
    })
    const mag32 = spectrum.magnitudes[32]
    const mag96 = spectrum.magnitudes[96]
    const mag64 = spectrum.magnitudes[64]
    expect(mag32).toBeCloseTo(1, 6)
    expect(mag96).toBeCloseTo(1, 6)
    expect(mag64).toBeLessThan(0.05)
  })

  it('zero-pads a short window and reports usedSamples', () => {
    const tone = cosine(256, 16, 1).slice(0, 200)
    const spectrum = computeSpectrum(tone, 256, {
      startIndex: 0,
      endIndex: tone.length - 1,
      fftSize: 256,
      window: 'rectangular'
    })
    expect(spectrum.usedSamples).toBe(200)
    expect(spectrum.fftSize).toBe(256)
    expect(spectrum.peakFrequency).toBeGreaterThan(0)
  })

  it('rejects illegal FFT sizes and short ranges', () => {
    expect(() =>
      computeSpectrum([1, 2, 3, 4, 5], 1000, {
        startIndex: 0,
        endIndex: 4,
        fftSize: 1000,
        window: 'hann'
      })
    ).toThrow(/FFT size/)
    expect(() =>
      computeSpectrum([1, 2, 3], 1000, {
        startIndex: 0,
        endIndex: 2,
        fftSize: 256,
        window: 'hann'
      })
    ).toThrow(/at least 4/)
  })
})
