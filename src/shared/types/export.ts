export const EXPORT_FORMATS = ['csv', 'txt', 'json', 'dsb'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  txt: 'TXT',
  json: 'JSON',
  dsb: 'DSB'
}

export const EXPORT_EXTENSIONS: Record<ExportFormat, string> = {
  csv: '.csv',
  txt: '.txt',
  json: '.json',
  dsb: '.dsb'
}

export interface ExportRequest {
  datasetId: string
  format: ExportFormat
  channelIds: string[]
  startIndex: number
  endIndex: number
  fileName?: string
}

export interface ExportResult {
  name: string
  filePath: string
  relativePath: string
  format: ExportFormat
  sampleCount: number
  channelCount: number
  bytesWritten: number
}

export function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMATS as readonly string[]).includes(value)
}
