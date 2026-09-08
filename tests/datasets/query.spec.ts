import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { filterDatasets, validateDatasetName } from '@shared/datasets/query'
import type { DatasetInfo } from '@shared/types/dataset'

function info(partial: Partial<DatasetInfo> & Pick<DatasetInfo, 'id' | 'name'>): DatasetInfo {
  return {
    sampleRate: 1000,
    channelCount: 1,
    sampleCount: 2,
    startTime: 0,
    duration: 0.001,
    channels: [
      {
        id: `${partial.id}-ch1`,
        name: 'ch1',
        unit: 'V',
        color: '#fff',
        visible: true,
        index: 0
      }
    ],
    markers: [],
    metadata: {
      sourcePath: 'data/demo.csv',
      sourceFormat: 'csv',
      importedAt: 0,
      fileSize: 10,
      encoding: 'utf-8'
    },
    ...partial
  }
}

describe('validateDatasetName', () => {
  it('trims a valid name', () => {
    expect(validateDatasetName('  run-01  ')).toBe('run-01')
  })

  it('rejects empty and whitespace names', () => {
    expect(() => validateDatasetName('')).toThrow(DataScopeError)
    expect(() => validateDatasetName('   ')).toThrow(DataScopeError)
  })

  it('rejects reserved filename characters', () => {
    try {
      validateDatasetName('a/b')
      throw new Error('expected failure')
    } catch (error) {
      expect(error).toBeInstanceOf(DataScopeError)
      expect((error as DataScopeError).code).toBe('VALIDATION_ERROR')
    }
  })

  it('rejects names longer than 128 characters', () => {
    expect(() => validateDatasetName('x'.repeat(129))).toThrow(DataScopeError)
  })
})

describe('filterDatasets', () => {
  const datasets = [
    info({ id: '1', name: 'motor-left' }),
    info({
      id: '2',
      name: 'battery',
      metadata: {
        sourcePath: 'data/battery.json',
        sourceFormat: 'json',
        importedAt: 0,
        fileSize: 10,
        encoding: 'utf-8'
      }
    }),
    info({
      id: '3',
      name: '温度',
      channels: [
        {
          id: '3-ch1',
          name: '通道一',
          unit: 'C',
          color: '#fff',
          visible: true,
          index: 0
        }
      ]
    })
  ]

  it('returns all datasets for an empty query', () => {
    expect(filterDatasets(datasets, '  ')).toHaveLength(3)
  })

  it('filters by dataset name case-insensitively', () => {
    expect(filterDatasets(datasets, 'MOTOR').map((item) => item.id)).toEqual(['1'])
  })

  it('filters by source format', () => {
    expect(filterDatasets(datasets, 'json').map((item) => item.id)).toEqual(['2'])
  })

  it('filters by channel name including unicode', () => {
    expect(filterDatasets(datasets, '通道').map((item) => item.id)).toEqual(['3'])
  })
})
