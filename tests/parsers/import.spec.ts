import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { parseCSV, parseTXT } from '@shared/parsers/csv'
import { parseJSON } from '@shared/parsers/json'
import { validateDataset } from '@shared/parsers/dataset'

const fixture = (...segments: string[]): string =>
  readFileSync(join(__dirname, '..', 'fixtures', ...segments), 'utf8')

describe('parseCSV', () => {
  it('imports a normal CSV', () => {
    const dataset = parseCSV(fixture('csv', 'normal.csv'), 'normal.csv')
    expect(dataset.channelCount).toBe(3)
    expect(dataset.sampleCount).toBe(4)
    expect(dataset.channels.map((channel) => channel.name)).toEqual(['ch1', 'ch2', 'ch3'])
    expect(dataset.samples[0][0]).toBeCloseTo(1.2)
    expect(dataset.sampleRate).toBeCloseTo(1000)
    validateDataset(dataset)
  })

  it('rejects an empty CSV', () => {
    expect(() => parseCSV(fixture('csv', 'empty.csv'), 'empty.csv')).toThrow(DataScopeError)
    try {
      parseCSV(fixture('csv', 'empty.csv'), 'empty.csv')
    } catch (error) {
      expect(error).toBeInstanceOf(DataScopeError)
      expect((error as DataScopeError).code).toBe('FILE_EMPTY')
    }
  })

  it('rejects a malformed CSV with inconsistent columns', () => {
    expect(() => parseCSV(fixture('csv', 'malformed.csv'), 'malformed.csv')).toThrow(DataScopeError)
    try {
      parseCSV(fixture('csv', 'malformed.csv'), 'malformed.csv')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('COLUMN_MISMATCH')
    }
  })

  it('imports a unicode CSV with Chinese headers', () => {
    const dataset = parseCSV(fixture('csv', 'unicode.csv'), '中文路径/unicode.csv')
    expect(dataset.channels[0].name).toBe('通道一')
    expect(dataset.channels[1].name).toBe('通道二')
    expect(dataset.sampleCount).toBe(3)
  })

  it('rejects a CSV without a header', () => {
    expect(() => parseCSV(fixture('csv', 'header-missing.csv'))).toThrow(DataScopeError)
  })

  it('rejects NaN values', () => {
    try {
      parseCSV(fixture('csv', 'nan.csv'))
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('NAN_OR_INFINITY')
    }
  })

  it('rejects Infinity values', () => {
    try {
      parseCSV(fixture('csv', 'infinity.csv'))
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('NAN_OR_INFINITY')
    }
  })

  it('rejects decreasing timestamps', () => {
    try {
      parseCSV(fixture('csv', 'timestamp-error.csv'))
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('INVALID_TIMESTAMP')
    }
  })

  it('imports a large CSV without creating per-sample objects', () => {
    const rows = 20_000
    const header = 'timestamp,ch1,ch2,ch3,ch4'
    const lines = [header]
    for (let i = 0; i < rows; i += 1) {
      const t = i / 1000
      lines.push(`${t},${Math.sin(i / 50)},${Math.cos(i / 80)},${i % 10},${(i % 7) - 3}`)
    }
    const dataset = parseCSV(lines.join('\n'), 'large.csv')
    expect(dataset.sampleCount).toBe(rows)
    expect(dataset.channelCount).toBe(4)
    expect(Array.isArray(dataset.samples[0])).toBe(true)
    expect(dataset.samples[0].length).toBe(rows)
  })

  it('imports PERG datetime timestamps from the local research dataset', () => {
    const dataset = parseCSV(fixture('csv', 'datetime-perg.csv'), 'datetime-perg.csv')
    expect(dataset.channelCount).toBe(2)
    expect(dataset.channels.map((channel) => channel.name)).toEqual(['RE_1', 'LE_1'])
    expect(dataset.sampleCount).toBe(12)
    expect(dataset.sampleRate).toBeCloseTo(1 / 0.0006, 0)
    expect(dataset.samples[0][1]).toBeCloseTo(-0.1)
    validateDataset(dataset)
  })

  it('imports the full PERG sample copied from dataset/', () => {
    const content = readFileSync(join(__dirname, '..', '..', 'samples', 'perg-ioba-0001.csv'), 'utf8')
    const dataset = parseCSV(content, 'perg-ioba-0001.csv')
    expect(dataset.sampleCount).toBe(255)
    expect(dataset.channelCount).toBe(2)
    validateDataset(dataset)
  })

  it('rejects an unreadable timestamp cell', () => {
    try {
      parseCSV('timestamp,ch1\nnot-a-time,1\n')
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('INVALID_TIMESTAMP')
    }
  })
})

describe('parseTXT', () => {
  it('parses tab-separated text', () => {
    const content = 'timestamp\tch1\tch2\n0.000\t1.0\t2.0\n0.001\t1.1\t2.1\n'
    const dataset = parseTXT(content, 'demo.txt')
    expect(dataset.channelCount).toBe(2)
    expect(dataset.sampleCount).toBe(2)
  })
})

describe('parseJSON', () => {
  it('imports row-major JSON', () => {
    const dataset = parseJSON(fixture('json', 'normal.json'), 'normal.json')
    expect(dataset.name).toBe('json-demo')
    expect(dataset.channelCount).toBe(2)
    expect(dataset.sampleCount).toBe(3)
    expect(dataset.sampleRate).toBe(1000)
  })

  it('imports channel-major JSON', () => {
    const content = JSON.stringify({
      name: 'channel-major',
      sampleRate: 500,
      channelNames: ['a', 'b'],
      samples: [
        [1, 2, 3, 4],
        [5, 6, 7, 8]
      ]
    })
    const dataset = parseJSON(content)
    expect(dataset.channelCount).toBe(2)
    expect(dataset.sampleCount).toBe(4)
    expect(dataset.sampleRate).toBe(500)
  })

  it('rejects empty JSON', () => {
    try {
      parseJSON('{}')
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('FILE_EMPTY')
    }
  })
})
