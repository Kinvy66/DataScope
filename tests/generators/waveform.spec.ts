import { describe, expect, it } from 'vitest'
import { generateDatasetFromRequest, generateChannel } from '@shared/generators/waveform'
import { validateGeneratorRequest } from '@shared/generators/validate'
import { DataScopeError } from '@shared/errors'
import { analyzeSpectrum } from '@shared/analysis/spectrum'
import type { GeneratorRequest } from '@shared/types/generator'

function base(partial: Partial<GeneratorRequest> = {}): GeneratorRequest {
  return {
    name: 'tone',
    kind: 'sine',
    channelCount: 1,
    sampleRate: 1000,
    duration: 1,
    frequency: 50,
    amplitude: 2,
    offset: 0,
    noiseLevel: 0,
    seed: 1,
    ...partial
  }
}

describe('validateGeneratorRequest', () => {
  it('accepts a normal sine request', () => {
    const request = validateGeneratorRequest(base())
    expect(request.name).toBe('tone')
    expect(request.channelCount).toBe(1)
  })

  it('rejects empty names, zero duration and frequency at Nyquist', () => {
    expect(() => validateGeneratorRequest(base({ name: '  ' }))).toThrow(DataScopeError)
    expect(() => validateGeneratorRequest(base({ duration: 0 }))).toThrow(DataScopeError)
    expect(() => validateGeneratorRequest(base({ frequency: 500 }))).toThrow(/奈奎斯特/)
    expect(() => validateGeneratorRequest(base({ channelCount: 0 }))).toThrow(DataScopeError)
  })
})

describe('generateChannel', () => {
  it('generates a sine that reaches amplitude near a quarter period', () => {
    const values = generateChannel(base({ frequency: 1, sampleRate: 400, duration: 1 }), 0, 400)
    expect(values).toHaveLength(400)
    expect(values[0]).toBeCloseTo(0, 8)
    expect(values[100]).toBeCloseTo(2, 8)
  })

  it('generates a square wave of ±amplitude', () => {
    const values = generateChannel(base({ kind: 'square', frequency: 1, sampleRate: 200 }), 0, 200)
    expect(new Set(values.slice(0, 50)).size).toBe(1)
    expect(Math.abs(values[0])).toBe(2)
  })

  it('generates a constant DC plus offset', () => {
    const values = generateChannel(base({ kind: 'dc', offset: 1.5, amplitude: 9 }), 0, 16)
    expect(values.every((value) => value === 1.5)).toBe(true)
  })
})

describe('generateDatasetFromRequest', () => {
  it('builds a dataset that FFT can recover the generated frequency from', () => {
    const dataset = generateDatasetFromRequest(
      base({
        sampleRate: 1024,
        duration: 1,
        frequency: 64,
        amplitude: 1.25,
        channelCount: 2
      })
    )
    expect(dataset.channelCount).toBe(2)
    expect(dataset.sampleCount).toBe(1024)
    expect(dataset.channels.map((channel) => channel.name)).toEqual(['ch1', 'ch2'])

    const spectrum = analyzeSpectrum(dataset, {
      datasetId: dataset.id,
      channelIds: [dataset.channels[0].id],
      startIndex: 0,
      endIndex: dataset.sampleCount - 1,
      fftSize: 1024,
      window: 'rectangular'
    })
    expect(spectrum.channels[0].peakFrequency).toBe(64)
    expect(spectrum.channels[0].peakMagnitude).toBeCloseTo(1.25, 2)
  })
})
