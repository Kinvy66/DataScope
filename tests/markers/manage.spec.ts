import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import {
  applyProjectMarkers,
  createMarker,
  elapsedSeconds,
  insertMarker,
  markerFromProjectRef,
  nextMarkerName,
  normalizeProjectMarkerRef,
  removeMarker,
  replaceMarker,
  sampleIndexToTime,
  sortMarkers,
  toProjectMarkerRef,
  updateMarker
} from '@shared/markers/manage'
import type { Dataset, Marker } from '@shared/types/dataset'

function dataset(partial: Partial<Dataset> = {}): Dataset {
  return {
    id: 'ds-1',
    name: 'demo',
    sampleRate: 1000,
    channelCount: 2,
    sampleCount: 10,
    startTime: 0,
    channels: [
      { id: 'ch-1', name: 'RE_1', unit: '', color: '#4CC2FF', visible: true, index: 0 },
      { id: 'ch-2', name: 'LE_1', unit: '', color: '#5EE0A0', visible: true, index: 1 }
    ],
    samples: [new Array(10).fill(0), new Array(10).fill(1)],
    markers: [],
    metadata: {
      sourcePath: 'memory.csv',
      sourceFormat: 'csv',
      importedAt: 0,
      fileSize: 0,
      encoding: 'utf-8'
    },
    ...partial
  }
}

describe('sample time conversion', () => {
  it('converts sample index to elapsed and absolute time', () => {
    expect(elapsedSeconds(1000, 5)).toBeCloseTo(0.005)
    expect(sampleIndexToTime(10, 1000, 5)).toBeCloseTo(10.005)
  })
})

describe('createMarker', () => {
  it('creates a marker from sample index and sorts later inserts', () => {
    const source = dataset()
    const late = createMarker(source, { name: 'B', sampleIndex: 8, type: 'peak' })
    const early = createMarker(source, { name: 'A', sampleIndex: 2, type: 'event' })
    const list = insertMarker(insertMarker([], late), early)
    expect(list.map((item) => item.name)).toEqual(['A', 'B'])
    expect(list[0].time).toBeCloseTo(0.002)
    expect(list[0].color).toBe('#FFD166')
    expect(list[1].color).toBe('#FF6B6B')
  })

  it('creates a marker from time when sample index is omitted', () => {
    const marker = createMarker(dataset({ startTime: 2 }), { name: 'T', time: 2.004 })
    expect(marker.sampleIndex).toBe(4)
    expect(marker.time).toBeCloseTo(2.004)
  })

  it('rejects out-of-range sample indexes', () => {
    try {
      createMarker(dataset(), { name: 'X', sampleIndex: 10 })
      throw new Error('expected failure')
    } catch (error) {
      expect(error).toBeInstanceOf(DataScopeError)
      expect((error as DataScopeError).code).toBe('VALIDATION_ERROR')
    }
    expect(() => createMarker(dataset(), { name: 'X', sampleIndex: -1 })).toThrow(DataScopeError)
  })

  it('rejects a non-integer sample index and empty name', () => {
    expect(() => createMarker(dataset(), { name: 'X', sampleIndex: 1.5 })).toThrow(DataScopeError)
    expect(() => createMarker(dataset(), { name: '  ', sampleIndex: 1 })).toThrow(DataScopeError)
  })

  it('rejects an unknown channel', () => {
    expect(() =>
      createMarker(dataset(), { name: 'X', sampleIndex: 1, channelId: 'missing' })
    ).toThrow(DataScopeError)
  })
})

describe('update and remove markers', () => {
  it('updates fields and keeps the original id', () => {
    const source = dataset()
    const created = createMarker(source, { name: 'M1', sampleIndex: 1, note: 'old' }, 'mk-fixed')
    const updated = updateMarker(source, created, { name: 'M1-b', sampleIndex: 3, note: 'new' })
    expect(updated.id).toBe('mk-fixed')
    expect(updated.sampleIndex).toBe(3)
    expect(updated.note).toBe('new')
    const list = replaceMarker([created], updated)
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('M1-b')
  })

  it('removes a marker and rejects a missing id', () => {
    const marker = createMarker(dataset(), { name: 'M1', sampleIndex: 1 }, 'mk-1')
    expect(removeMarker([marker], 'mk-1')).toEqual([])
    try {
      removeMarker([marker], 'missing')
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('FILE_NOT_FOUND')
    }
  })

  it('assigns the next unused M-number', () => {
    const markers: Marker[] = [
      createMarker(dataset(), { name: 'M1', sampleIndex: 0 }),
      createMarker(dataset(), { name: 'M3', sampleIndex: 1 })
    ]
    expect(nextMarkerName(markers)).toBe('M2')
  })
})

describe('project marker persistence', () => {
  it('round-trips through project.json refs', () => {
    const source = dataset()
    const marker = createMarker(source, {
      name: 'P100',
      type: 'custom',
      sampleIndex: 6,
      channelId: 'ch-1',
      note: 'perg peak'
    })
    const ref = toProjectMarkerRef(source.id, marker)
    const restored = markerFromProjectRef(source, ref)
    expect(restored).toMatchObject({
      id: marker.id,
      name: 'P100',
      type: 'custom',
      sampleIndex: 6,
      channelId: 'ch-1',
      note: 'perg peak'
    })
  })

  it('hydrates a legacy project marker from time only', () => {
    const ref = normalizeProjectMarkerRef({
      id: 'mk-legacy',
      datasetId: 'ds-1',
      name: 'old',
      time: 0.007
    })
    expect(ref).not.toBeNull()
    const marker = markerFromProjectRef(dataset(), ref!)
    expect(marker.sampleIndex).toBe(7)
    expect(marker.type).toBe('event')
  })

  it('applies only matching dataset refs and skips invalid ones', () => {
    const source = dataset()
    const markers = applyProjectMarkers(source, [
      {
        id: 'mk-ok',
        datasetId: 'ds-1',
        name: 'ok',
        type: 'event',
        sampleIndex: 2,
        time: 0.002,
        color: '#FFD166',
        note: ''
      },
      {
        id: 'mk-other',
        datasetId: 'ds-other',
        name: 'skip',
        type: 'event',
        sampleIndex: 1,
        time: 0.001,
        color: '#FFD166',
        note: ''
      },
      {
        id: 'mk-bad',
        datasetId: 'ds-1',
        name: 'bad',
        type: 'event',
        sampleIndex: 99,
        time: 1,
        color: '#FFD166',
        note: ''
      }
    ])
    expect(markers.map((item) => item.id)).toEqual(['mk-ok'])
  })
})

describe('sortMarkers', () => {
  it('orders by sample index then name', () => {
    const source = dataset()
    const sorted = sortMarkers([
      createMarker(source, { name: 'B', sampleIndex: 2 }),
      createMarker(source, { name: 'A', sampleIndex: 2 }),
      createMarker(source, { name: 'C', sampleIndex: 1 })
    ])
    expect(sorted.map((item) => item.name)).toEqual(['C', 'A', 'B'])
  })
})
