export type WindowType = 'rectangular' | 'hann' | 'hamming' | 'blackman'

export const FFT_SIZES = [256, 512, 1024, 2048, 4096, 8192, 16384] as const
export type FftSize = (typeof FFT_SIZES)[number]

export function isPowerOfTwo(value: number): boolean {
  return Number.isInteger(value) && value >= 2 && (value & (value - 1)) === 0
}

export function nextPowerOfTwo(value: number): number {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error('FFT size must be a positive finite number')
  }
  return 2 ** Math.ceil(Math.log2(Math.max(value, 2)))
}

export function isAllowedFftSize(value: number): value is FftSize {
  return (FFT_SIZES as readonly number[]).includes(value)
}

export function defaultFftSize(sampleCount: number): FftSize {
  for (let i = FFT_SIZES.length - 1; i >= 0; i -= 1) {
    if (FFT_SIZES[i] <= sampleCount) {
      return FFT_SIZES[i]
    }
  }
  return FFT_SIZES[0]
}

export function createWindow(length: number, type: WindowType): number[] {
  if (!(length > 0) || !Number.isInteger(length)) {
    throw new Error('Window length must be a positive integer')
  }
  if (length === 1) {
    return [1]
  }

  const weights = new Array<number>(length)
  const denom = length - 1
  for (let n = 0; n < length; n += 1) {
    const phase = (2 * Math.PI * n) / denom
    if (type === 'rectangular') {
      weights[n] = 1
    } else if (type === 'hann') {
      weights[n] = 0.5 * (1 - Math.cos(phase))
    } else if (type === 'hamming') {
      weights[n] = 0.54 - 0.46 * Math.cos(phase)
    } else {
      weights[n] = 0.42 - 0.5 * Math.cos(phase) + 0.08 * Math.cos(2 * phase)
    }
  }
  return weights
}

export function fftRadix2(real: Float64Array, imag: Float64Array): void {
  const n = real.length
  if (real.length !== imag.length) {
    throw new Error('FFT real and imag buffers must have the same length')
  }
  if (!isPowerOfTwo(n)) {
    throw new Error('FFT size must be a power of two')
  }

  let j = 0
  for (let i = 0; i < n; i += 1) {
    if (i < j) {
      const swapRe = real[i]
      real[i] = real[j]
      real[j] = swapRe
      const swapIm = imag[i]
      imag[i] = imag[j]
      imag[j] = swapIm
    }
    let mask = n >> 1
    while (mask >= 1 && j >= mask) {
      j -= mask
      mask >>= 1
    }
    j += mask
  }

  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2
    const theta = (-2 * Math.PI) / size
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k += 1) {
        const wr = Math.cos(theta * k)
        const wi = Math.sin(theta * k)
        const even = start + k
        const odd = even + half
        const tRe = wr * real[odd] - wi * imag[odd]
        const tIm = wr * imag[odd] + wi * real[odd]
        const evenRe = real[even]
        const evenIm = imag[even]
        real[even] = evenRe + tRe
        imag[even] = evenIm + tIm
        real[odd] = evenRe - tRe
        imag[odd] = evenIm - tIm
      }
    }
  }
}

export interface SpectrumTrace {
  frequencies: number[]
  magnitudes: number[]
  powers: number[]
  peakFrequency: number
  peakMagnitude: number
  peakPower: number
  fftSize: number
  usedSamples: number
  frequencyResolution: number
  nyquist: number
}

export function computeSpectrum(
  values: number[],
  sampleRate: number,
  options: {
    startIndex: number
    endIndex: number
    fftSize: number
    window: WindowType
  }
): SpectrumTrace {
  if (!(sampleRate > 0) || !Number.isFinite(sampleRate)) {
    throw new Error('sampleRate must be greater than 0')
  }
  if (!isAllowedFftSize(options.fftSize)) {
    throw new Error(`FFT size must be one of: ${FFT_SIZES.join(', ')}`)
  }
  if (options.startIndex < 0 || options.endIndex >= values.length || options.startIndex > options.endIndex) {
    throw new Error('Spectrum analysis range is invalid')
  }

  const available = options.endIndex - options.startIndex + 1
  if (available < 4) {
    throw new Error('Spectrum analysis needs at least 4 samples')
  }

  const usedSamples = Math.min(available, options.fftSize)
  const real = new Float64Array(options.fftSize)
  const imag = new Float64Array(options.fftSize)
  const weights = createWindow(usedSamples, options.window)
  let windowSum = 0

  for (let i = 0; i < usedSamples; i += 1) {
    const value = values[options.startIndex + i]
    if (!Number.isFinite(value)) {
      throw new Error('Cannot compute FFT of non-finite samples')
    }
    windowSum += weights[i]
    real[i] = value * weights[i]
  }

  if (!(windowSum > 0)) {
    throw new Error('Window sum must be greater than 0')
  }

  fftRadix2(real, imag)

  const binCount = options.fftSize / 2 + 1
  const frequencies = new Array<number>(binCount)
  const magnitudes = new Array<number>(binCount)
  const powers = new Array<number>(binCount)
  const frequencyResolution = sampleRate / options.fftSize
  let peakIndex = 0

  for (let k = 0; k < binCount; k += 1) {
    const hypot = Math.hypot(real[k], imag[k])
    const singleSided = k === 0 || k === binCount - 1 ? 1 : 2
    const magnitude = (hypot * singleSided) / windowSum
    frequencies[k] = k * frequencyResolution
    magnitudes[k] = magnitude
    powers[k] = magnitude * magnitude
    if (magnitude > magnitudes[peakIndex]) {
      peakIndex = k
    }
  }

  return {
    frequencies,
    magnitudes,
    powers,
    peakFrequency: frequencies[peakIndex],
    peakMagnitude: magnitudes[peakIndex],
    peakPower: powers[peakIndex],
    fftSize: options.fftSize,
    usedSamples,
    frequencyResolution,
    nyquist: sampleRate / 2
  }
}
