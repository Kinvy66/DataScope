import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { parseCSV, parseTXT } from '@shared/parsers/csv'
import { parseJSON } from '@shared/parsers/json'
import { serializeExport } from '@shared/exporters/serialize'
import { mapFsWriteError } from '@shared/exporters/fsError'
import type { Dataset } from '@shared/types/dataset'

function dataset(samples: number[][], startTime = 0, sampleRate = 1000): Dataset {
  return {
    id: 'ds-1',
    name: 'wave',
    sampleRate,
    channelCount: samples.length,
    sampleCount: samples[0]?.length ?? 0,
    startTime,
    channels: samples.map((_, index) => ({
      id: `ch-${index + 1}`,
      name: `ch${index + 1}`,
      unit: 'V',
      color: '#fff',
      visible: true,
      index
    })),
    samples,
    markers: [],
    metadata: {
      sourcePath: 'wave.json',
      sourceFormat: 'json',
      importedAt: 0,
      fileSize: 0,
      encoding: 'utf-8'
    }
  }
}

const source = dataset([
  [1.2, 1.3, 1.4],
  [2.3, 2.2, 2.1]
])

describe('serializeExport', () => {
  it('round-trips CSV through the importer', () => {
    const text = serializeExport(source, {
      format: 'csv',
      channelIds: ['ch-1', 'ch-2'],
      startIndex: 0,
      endIndex: 2
    })
    expect(text.startsWith('timestamp,ch1,ch2\n')).toBe(true)
    const parsed = parseCSV(text, 'export.csv')
    expect(parsed.channelCount).toBe(2)
    expect(parsed.sampleCount).toBe(3)
    expect(parsed.samples[0]).toEqual([1.2, 1.3, 1.4])
    expect(parsed.samples[1]).toEqual([2.3, 2.2, 2.1])
    expect(parsed.sampleRate).toBeCloseTo(1000)
  })

  it('round-trips tab-separated TXT', () => {
    const text = serializeExport(source, {
      format: 'txt',
      channelIds: ['ch-1', 'ch-2'],
      startIndex: 0,
      endIndex: 2
    })
    expect(text.startsWith('timestamp\tch1\tch2\n')).toBe(true)
    const parsed = parseTXT(text, 'export.txt')
    expect(parsed.samples[0]).toEqual(source.samples[0])
    expect(parsed.samples[1]).toEqual(source.samples[1])
  })

  it('round-trips JSON row-major samples', () => {
    const text = serializeExport(source, {
      format: 'json',
      channelIds: ['ch-1', 'ch-2'],
      startIndex: 0,
      endIndex: 2
    })
    const parsed = parseJSON(text, 'export.json')
    expect(parsed.name).toBe('wave')
    expect(parsed.sampleRate).toBe(1000)
    expect(parsed.samples[0]).toEqual(source.samples[0])
    expect(parsed.samples[1]).toEqual(source.samples[1])
  })

  it('exports a channel and sample subset', () => {
    const text = serializeExport(source, {
      format: 'csv',
      channelIds: ['ch-2'],
      startIndex: 1,
      endIndex: 2
    })
    const parsed = parseCSV(text, 'slice.csv')
    expect(parsed.channels.map((channel) => channel.name)).toEqual(['ch2'])
    expect(parsed.samples[0]).toEqual([2.2, 2.1])
    expect(parsed.sampleCount).toBe(2)
  })

  it('rejects empty channels and invalid ranges', () => {
    expect(() =>
      serializeExport(source, { format: 'csv', channelIds: [], startIndex: 0, endIndex: 1 })
    ).toThrow(DataScopeError)
    expect(() =>
      serializeExport(source, {
        format: 'csv',
        channelIds: ['missing'],
        startIndex: 0,
        endIndex: 1
      })
    ).toThrow(/通道不存在/)
    expect(() =>
      serializeExport(source, {
        format: 'csv',
        channelIds: ['ch-1'],
        startIndex: 2,
        endIndex: 0
      })
    ).toThrow(DataScopeError)
  })
})

describe('mapFsWriteError', () => {
  it('maps disk full and permission codes', () => {
    try {
      mapFsWriteError({ code: 'ENOSPC' }, 'F:/out.csv')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('FILE_DISK_FULL')
    }
    try {
      mapFsWriteError({ code: 'EACCES' }, 'F:/out.csv')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('FILE_PERMISSION')
    }
    try {
      mapFsWriteError({ code: 'ENOENT' }, 'F:/missing/out.csv')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('FILE_NOT_FOUND')
    }
  })
})
