import { describe, expect, it } from 'vitest'
import { analyzeSpectrum } from '@shared/analysis/spectrum'
import { DataScopeError } from '@shared/errors'
import type { Dataset } from '@shared/types/dataset'

function sineDataset(sampleRate: number, frequency: number, amplitude: number, sampleCount: number): Dataset {
  const values = Array.from(
    { length: sampleCount },
    (_, n) => amplitude * Math.sin((2 * Math.PI * frequency * n) / sampleRate)
  )
  return {
    id: 'ds-spec',
    name: 'tone',
    sampleRate,
    channelCount: 1,
    sampleCount,
    startTime: 0,
    channels: [
      {
        id: 'ch-1',
        name: 'ch1',
        unit: 'V',
        color: '#fff',
        visible: true,
        index: 0
      }
    ],
    samples: [values],
    markers: [],
    metadata: {
      sourcePath: 'memory.csv',
      sourceFormat: 'csv',
      importedAt: 0,
      fileSize: 0,
      encoding: 'utf-8'
    }
  }
}

describe('analyzeSpectrum', () => {
  it('returns peak frequency for an exact-bin sine', () => {
    const dataset = sineDataset(1024, 128, 1.5, 1024)
    const result = analyzeSpectrum(dataset, {
      datasetId: dataset.id,
      channelIds: ['ch-1'],
      startIndex: 0,
      endIndex: 1023,
      fftSize: 1024,
      window: 'rectangular'
    })

    expect(result.channels).toHaveLength(1)
    expect(result.nyquist).toBe(512)
    expect(result.frequencyResolution).toBe(1)
    expect(result.channels[0].peakFrequency).toBe(128)
    expect(result.channels[0].peakMagnitude).toBeCloseTo(1.5, 5)
    expect(result.outputPath).toBeNull()
  })

  it('rejects an empty channel selection', () => {
    const dataset = sineDataset(1024, 64, 1, 256)
    try {
      analyzeSpectrum(dataset, {
        datasetId: dataset.id,
        channelIds: [],
        startIndex: 0,
        endIndex: 255,
        fftSize: 256,
        window: 'hann'
      })
      throw new Error('expected failure')
    } catch (error) {
      expect(error).toBeInstanceOf(DataScopeError)
      expect((error as DataScopeError).code).toBe('VALIDATION_ERROR')
    }
  })
})
