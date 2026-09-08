import { DataScopeError } from '../errors'
import { createId } from '../parsers/common'
import type { Dataset, Marker, MarkerDraft, MarkerType } from '../types/dataset'
import type { ProjectMarkerRef } from '../types/project'

export const MARKER_TYPE_LABELS: Record<MarkerType, string> = {
  event: '事件',
  peak: '峰值',
  interval: '区间',
  custom: '自定义'
}

export const MARKER_TYPE_COLORS: Record<MarkerType, string> = {
  event: '#FFD166',
  peak: '#FF6B6B',
  interval: '#C084FC',
  custom: '#4CC2FF'
}

export function isMarkerType(value: unknown): value is MarkerType {
  return value === 'event' || value === 'peak' || value === 'interval' || value === 'custom'
}

export function sampleIndexToTime(startTime: number, sampleRate: number, sampleIndex: number): number {
  return startTime + sampleIndex / sampleRate
}

export function elapsedSeconds(sampleRate: number, sampleIndex: number): number {
  return sampleIndex / sampleRate
}

export function requireValidSampleIndex(sampleIndex: number, sampleCount: number): number {
  if (!Number.isFinite(sampleIndex) || !Number.isInteger(sampleIndex)) {
    throw new DataScopeError('VALIDATION_ERROR', '采样点必须是整数', { sampleIndex })
  }
  if (sampleCount <= 0) {
    throw new DataScopeError('VALIDATION_ERROR', '数据集没有可标记的采样点')
  }
  if (sampleIndex < 0 || sampleIndex >= sampleCount) {
    throw new DataScopeError(
      'VALIDATION_ERROR',
      `采样点超出范围: ${sampleIndex}（有效范围 0–${sampleCount - 1}）`,
      { sampleIndex, sampleCount }
    )
  }
  return sampleIndex
}

export function resolveSampleIndex(input: {
  sampleCount: number
  sampleRate: number
  startTime: number
  sampleIndex?: number
  time?: number
}): number {
  if (input.sampleIndex !== undefined && input.sampleIndex !== null) {
    return requireValidSampleIndex(input.sampleIndex, input.sampleCount)
  }
  if (input.time !== undefined && input.time !== null) {
    if (!Number.isFinite(input.time)) {
      throw new DataScopeError('VALIDATION_ERROR', '时间必须是有限数字')
    }
    const index = Math.round((input.time - input.startTime) * input.sampleRate)
    return requireValidSampleIndex(index, input.sampleCount)
  }
  throw new DataScopeError('VALIDATION_ERROR', '请提供采样点或时间')
}

export function validateMarkerName(name: string): string {
  const normalized = name.trim()
  if (!normalized) {
    throw new DataScopeError('VALIDATION_ERROR', 'Marker 名称不能为空')
  }
  if (normalized.length > 64) {
    throw new DataScopeError('VALIDATION_ERROR', 'Marker 名称不能超过 64 个字符')
  }
  return normalized
}

export function validateMarkerNote(note: string): string {
  if (note.length > 512) {
    throw new DataScopeError('VALIDATION_ERROR', 'Marker 备注不能超过 512 个字符')
  }
  return note
}

export function nextMarkerName(markers: Marker[]): string {
  const used = new Set(markers.map((marker) => marker.name))
  let index = 1
  while (used.has(`M${index}`)) {
    index += 1
  }
  return `M${index}`
}

export function sortMarkers(markers: Marker[]): Marker[] {
  return [...markers].sort((left, right) => {
    if (left.sampleIndex !== right.sampleIndex) {
      return left.sampleIndex - right.sampleIndex
    }
    return left.name.localeCompare(right.name, 'zh')
  })
}

export function createMarker(
  dataset: Pick<Dataset, 'sampleCount' | 'sampleRate' | 'startTime' | 'channels'>,
  draft: MarkerDraft,
  id = createId('mk')
): Marker {
  const sampleIndex = resolveSampleIndex({
    sampleCount: dataset.sampleCount,
    sampleRate: dataset.sampleRate,
    startTime: dataset.startTime,
    sampleIndex: draft.sampleIndex,
    time: draft.time
  })
  const type = draft.type && isMarkerType(draft.type) ? draft.type : 'event'
  const channelId = normalizeChannelId(draft.channelId, dataset.channels)
  return {
    id,
    name: validateMarkerName(draft.name),
    type,
    sampleIndex,
    time: sampleIndexToTime(dataset.startTime, dataset.sampleRate, sampleIndex),
    ...(channelId ? { channelId } : {}),
    color: resolveColor(draft.color, type),
    note: validateMarkerNote(draft.note ?? '')
  }
}

export function updateMarker(
  dataset: Pick<Dataset, 'sampleCount' | 'sampleRate' | 'startTime' | 'channels'>,
  current: Marker,
  draft: MarkerDraft
): Marker {
  return createMarker(
    dataset,
    {
      name: draft.name,
      type: draft.type ?? current.type,
      sampleIndex: draft.sampleIndex ?? current.sampleIndex,
      time: draft.sampleIndex === undefined && draft.time !== undefined ? draft.time : undefined,
      channelId: draft.channelId === undefined ? current.channelId : draft.channelId,
      color: draft.color ?? current.color,
      note: draft.note ?? current.note
    },
    current.id
  )
}

export function insertMarker(markers: Marker[], marker: Marker): Marker[] {
  if (markers.some((item) => item.id === marker.id)) {
    throw new DataScopeError('VALIDATION_ERROR', `Marker 已存在: ${marker.id}`)
  }
  return sortMarkers([...markers, marker])
}

export function replaceMarker(markers: Marker[], marker: Marker): Marker[] {
  const index = markers.findIndex((item) => item.id === marker.id)
  if (index < 0) {
    throw new DataScopeError('FILE_NOT_FOUND', `未找到 Marker: ${marker.id}`)
  }
  const next = [...markers]
  next[index] = marker
  return sortMarkers(next)
}

export function removeMarker(markers: Marker[], markerId: string): Marker[] {
  const next = markers.filter((item) => item.id !== markerId)
  if (next.length === markers.length) {
    throw new DataScopeError('FILE_NOT_FOUND', `未找到 Marker: ${markerId}`)
  }
  return next
}

export function toProjectMarkerRef(datasetId: string, marker: Marker): ProjectMarkerRef {
  return {
    id: marker.id,
    datasetId,
    name: marker.name,
    type: marker.type,
    sampleIndex: marker.sampleIndex,
    time: marker.time,
    ...(marker.channelId ? { channelId: marker.channelId } : {}),
    color: marker.color,
    note: marker.note
  }
}

export function markerFromProjectRef(
  dataset: Pick<Dataset, 'sampleCount' | 'sampleRate' | 'startTime' | 'channels'>,
  ref: ProjectMarkerRef
): Marker {
  return createMarker(
    dataset,
    {
      name: ref.name || nextMarkerName([]),
      type: isMarkerType(ref.type) ? ref.type : 'event',
      sampleIndex: Number.isFinite(ref.sampleIndex) ? ref.sampleIndex : undefined,
      time: Number.isFinite(ref.time) ? ref.time : undefined,
      channelId: ref.channelId,
      color: ref.color,
      note: ref.note
    },
    ref.id
  )
}

export function normalizeProjectMarkerRef(value: unknown): ProjectMarkerRef | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const raw = value as Record<string, unknown>
  const id = String(raw.id ?? '').trim()
  const datasetId = String(raw.datasetId ?? '').trim()
  if (!id || !datasetId) {
    return null
  }
  const sampleIndex = Number(raw.sampleIndex)
  const time = Number(raw.time)
  return {
    id,
    datasetId,
    name: String(raw.name ?? ''),
    type: isMarkerType(raw.type) ? raw.type : 'event',
    sampleIndex: Number.isFinite(sampleIndex) ? sampleIndex : Number.NaN,
    time: Number.isFinite(time) ? time : Number.NaN,
    ...(typeof raw.channelId === 'string' && raw.channelId.trim()
      ? { channelId: raw.channelId }
      : {}),
    color: String(raw.color ?? ''),
    note: String(raw.note ?? '')
  }
}

export function applyProjectMarkers(
  dataset: Dataset,
  refs: ProjectMarkerRef[]
): Marker[] {
  const attached: Marker[] = []
  for (const ref of refs) {
    if (ref.datasetId !== dataset.id) continue
    try {
      attached.push(markerFromProjectRef(dataset, ref))
    } catch {
      continue
    }
  }
  return sortMarkers(attached)
}

function normalizeChannelId(
  channelId: string | null | undefined,
  channels: Array<{ id: string }>
): string | undefined {
  if (channelId === undefined || channelId === null || channelId.trim() === '') {
    return undefined
  }
  const match = channels.find((channel) => channel.id === channelId)
  if (!match) {
    throw new DataScopeError('VALIDATION_ERROR', `通道不存在: ${channelId}`)
  }
  return match.id
}

function resolveColor(color: string | undefined, type: MarkerType): string {
  const trimmed = color?.trim() ?? ''
  if (!trimmed) {
    return MARKER_TYPE_COLORS[type]
  }
  if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(trimmed)) {
    throw new DataScopeError('VALIDATION_ERROR', `Marker 颜色无效: ${trimmed}`)
  }
  return trimmed
}
