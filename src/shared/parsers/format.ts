import type { SourceFormat } from '../types/dataset'

export function inferSourceFormat(filePath: string): SourceFormat {
  const lower = filePath.toLowerCase().replace(/\\/g, '/')
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.txt')) return 'txt'
  if (lower.endsWith('.dsb')) return 'dsb'
  return 'csv'
}
