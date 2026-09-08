import { describe, expect, it } from 'vitest'
import { crc32 } from '@shared/crypto/crc32'
import { DataScopeError } from '@shared/errors'
import { decodeDsb, encodeDsb } from '@shared/formats/dsb'
import { serializeExport } from '@shared/exporters/serialize'
import { inferSourceFormat } from '@shared/parsers/format'
import type { Dataset } from '@shared/types/dataset'

function dataset(samples: number[][], startTime = 0.5, sampleRate = 1000): Dataset {
  return {
    id: 'ds-1',
    name: 'wave',
    sampleRate,
    channelCount: samples.length,
    sampleCount: samples[0]?.length ?? 0,
    startTime,
    channels: samples.map((_, index) => ({
      id: `ch-${index + 1}`,
      name: index === 0 ? '通道一' : `ch${index + 1}`,
      unit: index === 0 ? 'uV' : '',
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

describe('DataScope Binary', () => {
  it('round-trips samples, rate, start time, names and units', () => {
    const bytes = encodeDsb(source, {
      format: 'dsb',
      channelIds: ['ch-1', 'ch-2'],
      startIndex: 0,
      endIndex: 2
    })
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe('DSB1')

    const parsed = decodeDsb(bytes, 'export.dsb')
    expect(parsed.metadata.sourceFormat).toBe('dsb')
    expect(parsed.name).toBe('wave')
    expect(parsed.sampleRate).toBe(1000)
    expect(parsed.startTime).toBeCloseTo(0.5)
    expect(parsed.channels[0].name).toBe('通道一')
    expect(parsed.channels[0].unit).toBe('uV')
    expect(parsed.samples[0]).toEqual([1.2, 1.3, 1.4])
    expect(parsed.samples[1]).toEqual([2.3, 2.2, 2.1])
  })

  it('exports a channel and sample subset', () => {
    const bytes = encodeDsb(source, {
      format: 'dsb',
      channelIds: ['ch-2'],
      startIndex: 1,
      endIndex: 2
    })
    const parsed = decodeDsb(bytes)
    expect(parsed.channelCount).toBe(1)
    expect(parsed.channels[0].name).toBe('ch2')
    expect(parsed.samples[0]).toEqual([2.2, 2.1])
    expect(parsed.startTime).toBeCloseTo(0.5 + 0.001)
  })

  it('rejects a truncated file, bad magic, bad version and bad CRC', () => {
    const encoded = encodeDsb(source, {
      format: 'dsb',
      channelIds: ['ch-1'],
      startIndex: 0,
      endIndex: 2
    })

    expect(() => decodeDsb(new Uint8Array())).toThrow(DataScopeError)
    try {
      decodeDsb(new Uint8Array())
    } catch (error) {
      expect((error as DataScopeError).code).toBe('FILE_EMPTY')
    }

    expect(() => decodeDsb(encoded.subarray(0, encoded.byteLength - 4))).toThrow(DataScopeError)

    const badMagic = encoded.slice()
    badMagic[0] = 0x00
    try {
      decodeDsb(badMagic)
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('INVALID_FORMAT')
    }

    const badVersion = encoded.slice()
    new DataView(badVersion.buffer).setUint16(4, 99, true)
    try {
      decodeDsb(badVersion)
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('INVALID_FORMAT')
    }

    const badCrc = encoded.slice()
    badCrc[badCrc.length - 1] ^= 0xff
    try {
      decodeDsb(badCrc)
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('INVALID_FORMAT')
    }
  })

  it('rejects Infinity payload after a valid CRC', () => {
    const encoded = encodeDsb(source, {
      format: 'dsb',
      channelIds: ['ch-1'],
      startIndex: 0,
      endIndex: 2
    })
    const poisoned = encoded.slice()
    const view = new DataView(poisoned.buffer)
    view.setFloat64(poisoned.byteLength - 12, Number.POSITIVE_INFINITY, true)
    view.setUint32(poisoned.byteLength - 4, crc32(poisoned.subarray(0, poisoned.byteLength - 4)), true)
    try {
      decodeDsb(poisoned)
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('NAN_OR_INFINITY')
    }
  })

  it('does not serialize DSB as text', () => {
    expect(() =>
      serializeExport(source, {
        format: 'dsb',
        channelIds: ['ch-1'],
        startIndex: 0,
        endIndex: 1
      })
    ).toThrow(/encodeDsb/)
  })

  it('infers .dsb from the file path', () => {
    expect(inferSourceFormat('C:\\data\\wave.dsb')).toBe('dsb')
    expect(inferSourceFormat('wave.JSON')).toBe('json')
    expect(inferSourceFormat('wave.csv')).toBe('csv')
  })
})
