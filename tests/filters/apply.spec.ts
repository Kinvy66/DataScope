import { describe, expect, it } from 'vitest'
import { applyFilterToDataset, applyFilterToDatasetAsync } from '@shared/filters/apply'
import { DataScopeError } from '@shared/errors'
import type { Dataset } from '@shared/types/dataset'
import type { FilterRequest } from '@shared/types/filter'

function dataset(samples: number[][]): Dataset {
  return {
    id: 'ds-1',
    name: 'raw',
    sampleRate: 1000,
    channelCount: samples.length,
    sampleCount: samples[0]?.length ?? 0,
    startTime: 0,
    channels: samples.map((_, index) => ({
      id: `ch-${index + 1}`,
      name: `ch${index + 1}`,
      unit: 'V',
      color: '#fff',
      visible: true,
      index
    })),
    samples,
    markers: [
      {
        id: 'mk-1',
        name: 'peak',
        type: 'peak',
        sampleIndex: 1,
        time: 0.001,
        color: '#f00',
        note: ''
      }
    ],
    metadata: {
      sourcePath: 'raw.json',
      sourceFormat: 'json',
      importedAt: 0,
      fileSize: 0,
      encoding: 'utf-8'
    }
  }
}

const base: Omit<FilterRequest, 'channelIds'> = {
  datasetId: 'ds-1',
  kind: 'dc-remove',
  cutoffHz: 40,
  lowHz: 10,
  highHz: 100,
  frequencyHz: 50,
  q: 30
}

describe('applyFilterToDataset', () => {
  it('filters selected channels and copies the rest', () => {
    const source = dataset([
      [3, 3, 3, 3],
      [1, 2, 3, 4]
    ])
    const result = applyFilterToDataset(source, { ...base, channelIds: ['ch-1'] })
    expect(result.id).not.toBe(source.id)
    expect(result.name).toContain('去直流')
    expect(result.samples[0].every((value) => Math.abs(value) < 1e-12)).toBe(true)
    expect(result.samples[1]).toEqual([1, 2, 3, 4])
    expect(result.markers).toEqual(source.markers)
    expect(result.markers).not.toBe(source.markers)
  })

  it('uses a custom name', () => {
    const result = applyFilterToDataset(dataset([[1, 2, 3, 4]]), {
      ...base,
      channelIds: ['ch-1'],
      name: 'filtered-dc'
    })
    expect(result.name).toBe('filtered-dc')
  })

  it('rejects missing channels', () => {
    expect(() => applyFilterToDataset(dataset([[1, 2, 3, 4]]), { ...base, channelIds: [] })).toThrow(
      DataScopeError
    )
    expect(() =>
      applyFilterToDataset(dataset([[1, 2, 3, 4]]), { ...base, channelIds: ['missing'] })
    ).toThrow(/通道不存在/)
  })

  it('async per-channel path matches the sync result shape', async () => {
    const source = dataset([[1, 2, 3, 4], [10, 10, 10, 10]])
    const request = { ...base, channelIds: ['ch-1', 'ch-2'], kind: 'dc-remove' as const }
    const sync = applyFilterToDataset(source, request)
    const asyncResult = await applyFilterToDatasetAsync(source, request)
    expect(asyncResult.samples[0]).toEqual(sync.samples[0])
    expect(asyncResult.samples[1]).toEqual(sync.samples[1])
    expect(asyncResult.name).toBe(sync.name)
  })
})
