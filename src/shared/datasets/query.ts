import { DataScopeError } from '../errors'
import type { DatasetInfo } from '../types/dataset'

export function normalizeDatasetName(name: string): string {
  return name.trim()
}

export function validateDatasetName(name: string): string {
  const normalized = normalizeDatasetName(name)
  if (!normalized) {
    throw new DataScopeError('VALIDATION_ERROR', '数据集名称不能为空')
  }
  if (normalized.length > 128) {
    throw new DataScopeError('VALIDATION_ERROR', '数据集名称不能超过 128 个字符')
  }
  if (/[<>:"/\\|?*]/.test(normalized)) {
    throw new DataScopeError('VALIDATION_ERROR', '数据集名称不能包含 \\ / : * ? " < > |')
  }
  return normalized
}

export function filterDatasets(datasets: DatasetInfo[], query: string): DatasetInfo[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return datasets
  return datasets.filter((item) => {
    const haystack = [
      item.name,
      item.metadata.sourceFormat,
      ...item.channels.map((channel) => channel.name)
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(needle)
  })
}
