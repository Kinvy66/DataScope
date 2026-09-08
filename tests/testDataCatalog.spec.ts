import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { parseCSV } from '@shared/parsers/csv'
import { parseJSON } from '@shared/parsers/json'

const root = join(__dirname, '..', 'test-data')

function catalog(...segments: string[]): string {
  return join(root, ...segments)
}

describe('test-data catalog', () => {
  it('has the PRD classified folders', () => {
    for (const folder of ['normal', 'empty', 'malformed', 'boundary', 'large', 'unicode', 'abnormal']) {
      expect(existsSync(catalog(folder))).toBe(true)
      expect(statSync(catalog(folder)).isDirectory()).toBe(true)
    }
  })

  it('imports the normal CSV used by E2E smoke', () => {
    const dataset = parseCSV(readFileSync(catalog('normal', 'normal.csv'), 'utf8'), 'normal.csv')
    expect(dataset.channelCount).toBe(3)
    expect(dataset.sampleCount).toBe(4)
  })

  it('imports the normal JSON sample', () => {
    const dataset = parseJSON(readFileSync(catalog('normal', 'normal.json'), 'utf8'), 'normal.json')
    expect(dataset.channelCount).toBe(2)
    expect(dataset.sampleCount).toBe(3)
  })

  it('imports unicode headers and a Chinese filename sample', () => {
    const named = parseCSV(readFileSync(catalog('unicode', 'unicode.csv'), 'utf8'), 'unicode.csv')
    expect(named.channels.map((channel) => channel.name)).toEqual(['通道一', '通道二'])

    const chinesePath = catalog('unicode', '中文文件名.csv')
    const dataset = parseCSV(readFileSync(chinesePath, 'utf8'), chinesePath)
    expect(dataset.sampleCount).toBe(3)
    expect(dataset.name).toBe('中文文件名')
  })

  it('imports the shortest legal boundary CSV', () => {
    const dataset = parseCSV(readFileSync(catalog('boundary', 'two-samples.csv'), 'utf8'))
    expect(dataset.sampleCount).toBe(2)
  })

  it('includes a large sample that is not the 32×1e6 performance fixture', () => {
    const content = readFileSync(catalog('large', '4ch-5000.csv'), 'utf8')
    const lines = content.trim().split(/\r?\n/)
    expect(lines[0]).toBe('timestamp,ch1,ch2,ch3,ch4')
    expect(lines.length).toBe(5001)
  })

  it('rejects empty, malformed, and abnormal files', () => {
    const cases: Array<[string[], string]> = [
      [['empty', 'empty.csv'], 'FILE_EMPTY'],
      [['empty', 'header-only.csv'], 'FILE_EMPTY'],
      [['malformed', 'ragged-columns.csv'], 'COLUMN_MISMATCH'],
      [['malformed', 'header-missing.csv'], 'HEADER_MISSING'],
      [['abnormal', 'nan.csv'], 'NAN_OR_INFINITY'],
      [['abnormal', 'infinity.csv'], 'NAN_OR_INFINITY'],
      [['abnormal', 'timestamp-rollback.csv'], 'INVALID_TIMESTAMP']
    ]

    for (const [segments, code] of cases) {
      try {
        parseCSV(readFileSync(catalog(...segments), 'utf8'), segments.at(-1))
        throw new Error(`expected ${segments.join('/')} to fail`)
      } catch (error) {
        expect(error).toBeInstanceOf(DataScopeError)
        expect((error as DataScopeError).code).toBe(code)
      }
    }
  })
})
