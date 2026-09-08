import { describe, expect, it } from 'vitest'
import { analyzeTimeDomain } from '@shared/analysis/timeDomain'
import { DataScopeError } from '@shared/errors'
import { parseCSV } from '@shared/parsers/csv'
import type { Dataset } from '@shared/types/dataset'

function dataset(samples: number[][], names = ['ch1', 'ch2']): Dataset {
  return {
    id: 'ds-1',
    name: 'demo',
    sampleRate: 1000,
    channelCount: samples.length,
    sampleCount: samples[0]?.length ?? 0,
    startTime: 0,
    channels: names.map((name, index) => ({
      id: `ch-${index + 1}`,
      name,
      unit: 'V',
      color: '#fff',
      visible: true,
      index
    })),
    samples,
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

describe('analyzeTimeDomain', () => {
  it('returns per-channel statistics for the selected window', () => {
    const result = analyzeTimeDomain(dataset([[1, 2, 3, 4], [4, 3, 2, 1]]), {
      datasetId: 'ds-1',
      channelIds: ['ch-1', 'ch-2'],
      startIndex: 0,
      endIndex: 3
    })

    expect(result.datasetName).toBe('demo')
    expect(result.sampleCount).toBe(4)
    expect(result.duration).toBeCloseTo(0.003)
    expect(result.channels).toHaveLength(2)
    expect(result.channels[0].mean).toBe(2.5)
    expect(result.channels[0].median).toBe(2.5)
    expect(result.channels[1].min).toBe(1)
    expect(result.channels[1].max).toBe(4)
    expect(result.outputPath).toBeNull()
  })

  it('limits analysis to the requested channel and sample range', () => {
    const result = analyzeTimeDomain(dataset([[1, 10, 100, 1000], [0, 0, 0, 0]]), {
      datasetId: 'ds-1',
      channelIds: ['ch-1'],
      startIndex: 1,
      endIndex: 2
    })

    expect(result.channels).toHaveLength(1)
    expect(result.startIndex).toBe(1)
    expect(result.endIndex).toBe(2)
    expect(result.channels[0].min).toBe(10)
    expect(result.channels[0].max).toBe(100)
    expect(result.channels[0].mean).toBe(55)
  })

  it('rejects an empty channel selection', () => {
    try {
      analyzeTimeDomain(dataset([[1, 2]]), {
        datasetId: 'ds-1',
        channelIds: [],
        startIndex: 0,
        endIndex: 1
      })
      throw new Error('expected failure')
    } catch (error) {
      expect(error).toBeInstanceOf(DataScopeError)
      expect((error as DataScopeError).code).toBe('VALIDATION_ERROR')
    }
  })

  it('rejects a missing channel id', () => {
    try {
      analyzeTimeDomain(dataset([[1, 2]]), {
        datasetId: 'ds-1',
        channelIds: ['missing'],
        startIndex: 0,
        endIndex: 1
      })
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('VALIDATION_ERROR')
    }
  })

  it('analyzes a parsed CSV the same way as the import pipeline', () => {
    const csv = parseCSV('timestamp,ch1,ch2\n0.000,1,4\n0.001,2,3\n0.002,3,2\n0.003,4,1\n', 'pipe.csv')
    const result = analyzeTimeDomain(csv, {
      datasetId: csv.id,
      channelIds: csv.channels.map((channel) => channel.id),
      startIndex: 0,
      endIndex: csv.sampleCount - 1
    })
    expect(result.channels[0].peakToPeak).toBe(3)
    expect(result.channels[1].mean).toBe(2.5)
  })
})
