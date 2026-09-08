export const FILTER_KINDS = ['dc-remove', 'lowpass', 'highpass', 'bandpass', 'notch'] as const
export type FilterKind = (typeof FILTER_KINDS)[number]

export interface FilterSpec {
  kind: FilterKind
  cutoffHz: number
  lowHz: number
  highHz: number
  frequencyHz: number
  q: number
}

export interface FilterRequest extends FilterSpec {
  datasetId: string
  channelIds: string[]
  name?: string
}

export const DEFAULT_FILTER_SPEC: FilterSpec = {
  kind: 'lowpass',
  cutoffHz: 40,
  lowHz: 10,
  highHz: 100,
  frequencyHz: 50,
  q: 30
}
