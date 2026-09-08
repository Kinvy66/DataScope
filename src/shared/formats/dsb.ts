import { crc32 } from '../crypto/crc32'
import { DataScopeError } from '../errors'
import { formatExportNumber, resolveExportPlan, sampleAt, type ResolvedExport } from '../exporters/serialize'
import { buildDataset } from '../parsers/common'
import type { Dataset } from '../types/dataset'
import type { ExportRequest } from '../types/export'

/** ASCII "DSB1" */
export const DSB_MAGIC = new Uint8Array([0x44, 0x53, 0x42, 0x31])
export const DSB_VERSION = 1
export const DSB_MAX_VALUES = 32 * 2_000_000
export const DSB_MAX_STRING_BYTES = 255

const FIXED_HEADER_BYTES = 32

/**
 * DataScope Binary v1 (little-endian):
 * magic "DSB1" | uint16 version | uint16 flags | float64 sampleRate | float64 startTime
 * | uint32 channelCount | uint32 sampleCount | utf8 name | per channel utf8 name+unit
 * | channel-major float64 samples | crc32 of all preceding bytes
 */
export function encodeDsb(
  dataset: Dataset,
  request: Pick<ExportRequest, 'format' | 'channelIds' | 'startIndex' | 'endIndex'>
): Uint8Array {
  const plan = resolveExportPlan(dataset, request)
  const header = encodeDsbHeader(plan)
  const sampleCount = plan.range.sampleCount
  const payloadBytes = plan.channels.length * sampleCount * 8
  const out = new Uint8Array(header.byteLength + payloadBytes + 4)
  out.set(header, 0)
  const view = new DataView(out.buffer)
  let offset = header.byteLength
  for (const channel of plan.channels) {
    for (let index = 0; index < sampleCount; index += 1) {
      const value = sampleAt(dataset, channel, plan.range.startIndex + index)
      formatExportNumber(value)
      view.setFloat64(offset, value, true)
      offset += 8
    }
  }
  view.setUint32(offset, crc32(out.subarray(0, offset)), true)
  return out
}

export function encodeDsbHeader(plan: ResolvedExport): Uint8Array {
  if (plan.format !== 'dsb') {
    throw new DataScopeError('VALIDATION_ERROR', 'DSB 编码器仅支持 dsb 格式')
  }
  if (!(plan.sampleRate > 0) || !Number.isFinite(plan.sampleRate)) {
    throw new DataScopeError('VALIDATION_ERROR', '采样率必须为正数')
  }
  if (!Number.isFinite(plan.startTime)) {
    throw new DataScopeError('VALIDATION_ERROR', '起始时间无效')
  }
  const values = plan.channels.length * plan.range.sampleCount
  if (values < 1) {
    throw new DataScopeError('FILE_EMPTY', '没有可导出的采样点')
  }
  if (values > DSB_MAX_VALUES) {
    throw new DataScopeError('VALIDATION_ERROR', '导出数据超过 DSB 容量上限')
  }

  const nameBytes = encodeUtf8Limited(plan.name || 'dataset')
  const channelFields = plan.channels.map((channel, index) => ({
    name: encodeUtf8Limited(channel.name.trim() || `ch${index + 1}`),
    unit: encodeUtf8Limited(channel.unit ?? '')
  }))

  let size = FIXED_HEADER_BYTES + 2 + nameBytes.byteLength
  for (const field of channelFields) {
    size += 4 + field.name.byteLength + field.unit.byteLength
  }

  const header = new Uint8Array(size)
  const view = new DataView(header.buffer)
  header.set(DSB_MAGIC, 0)
  view.setUint16(4, DSB_VERSION, true)
  view.setUint16(6, 0, true)
  view.setFloat64(8, plan.sampleRate, true)
  view.setFloat64(16, plan.startTime, true)
  view.setUint32(24, plan.channels.length, true)
  view.setUint32(28, plan.range.sampleCount, true)

  let offset = FIXED_HEADER_BYTES
  offset = writeCountedBytes(header, view, offset, nameBytes)
  for (const field of channelFields) {
    offset = writeCountedBytes(header, view, offset, field.name)
    offset = writeCountedBytes(header, view, offset, field.unit)
  }
  return header
}

export function decodeDsb(bytes: Uint8Array, sourcePath = 'memory.dsb'): Dataset {
  if (bytes.byteLength === 0) {
    throw new DataScopeError('FILE_EMPTY', '文件为空，无法导入')
  }
  if (bytes.byteLength < FIXED_HEADER_BYTES + 6) {
    throw new DataScopeError('INVALID_FORMAT', 'DSB 文件过短')
  }

  if (
    bytes[0] !== DSB_MAGIC[0] ||
    bytes[1] !== DSB_MAGIC[1] ||
    bytes[2] !== DSB_MAGIC[2] ||
    bytes[3] !== DSB_MAGIC[3]
  ) {
    throw new DataScopeError('INVALID_FORMAT', '不是 DataScope Binary 文件（缺少 DSB1 魔数）')
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const version = view.getUint16(4, true)
  if (version !== DSB_VERSION) {
    throw new DataScopeError('INVALID_FORMAT', `不支持的 DSB 版本: ${version}`)
  }

  const sampleRate = view.getFloat64(8, true)
  const startTime = view.getFloat64(16, true)
  const channelCount = view.getUint32(24, true)
  const sampleCount = view.getUint32(28, true)

  if (!(sampleRate > 0) || !Number.isFinite(sampleRate)) {
    throw new DataScopeError('VALIDATION_ERROR', '采样率必须为正数')
  }
  if (!Number.isFinite(startTime)) {
    throw new DataScopeError('INVALID_TIMESTAMP', '起始时间无效')
  }
  if (channelCount < 1) {
    throw new DataScopeError('INVALID_CHANNEL_COUNT', '至少需要 1 个通道')
  }
  if (sampleCount < 1) {
    throw new DataScopeError('FILE_EMPTY', '仅有文件头，没有采样数据')
  }
  if (channelCount * sampleCount > DSB_MAX_VALUES) {
    throw new DataScopeError('INVALID_FORMAT', 'DSB 声明的通道×点数超过上限')
  }

  let offset = FIXED_HEADER_BYTES
  const name = readCountedString(bytes, view, offset)
  offset = name.next
  const channelNames: string[] = []
  const units: string[] = []
  for (let channel = 0; channel < channelCount; channel += 1) {
    const channelName = readCountedString(bytes, view, offset)
    offset = channelName.next
    const unit = readCountedString(bytes, view, offset)
    offset = unit.next
    channelNames.push(channelName.value || `ch${channel + 1}`)
    units.push(unit.value)
  }

  const payloadBytes = channelCount * sampleCount * 8
  const crcOffset = offset + payloadBytes
  if (bytes.byteLength !== crcOffset + 4) {
    throw new DataScopeError('INVALID_FORMAT', 'DSB 长度与声明的通道/点数不匹配')
  }

  const expectedCrc = view.getUint32(crcOffset, true)
  const actualCrc = crc32(bytes.subarray(0, crcOffset))
  if (expectedCrc !== actualCrc) {
    throw new DataScopeError('INVALID_FORMAT', 'DSB CRC 校验失败')
  }

  const columns: number[][] = []
  for (let channel = 0; channel < channelCount; channel += 1) {
    const column = new Array<number>(sampleCount)
    for (let sample = 0; sample < sampleCount; sample += 1) {
      const value = view.getFloat64(offset, true)
      if (!Number.isFinite(value)) {
        throw new DataScopeError('NAN_OR_INFINITY', 'DSB 包含非有限采样值', {
          row: sample + 1,
          column: channel + 1
        })
      }
      column[sample] = value
      offset += 8
    }
    columns.push(column)
  }

  const timestamps = Array.from(
    { length: sampleCount },
    (_, index) => startTime + index / sampleRate
  )

  const dataset = buildDataset({
    name: name.value || fileNameFromPath(sourcePath),
    table: { channelNames, timestamps, columns },
    sourcePath,
    sourceFormat: 'dsb',
    fileSize: bytes.byteLength,
    encoding: 'binary',
    sampleRateHint: sampleRate
  })

  for (let index = 0; index < dataset.channels.length; index += 1) {
    dataset.channels[index].unit = units[index] ?? ''
  }
  return dataset
}

function encodeUtf8Limited(text: string): Uint8Array {
  const encoder = new TextEncoder()
  let value = text
  let bytes = encoder.encode(value)
  while (bytes.byteLength > DSB_MAX_STRING_BYTES && value.length > 0) {
    value = value.slice(0, -1)
    bytes = encoder.encode(value)
  }
  return bytes
}

function writeCountedBytes(
  target: Uint8Array,
  view: DataView,
  offset: number,
  bytes: Uint8Array
): number {
  view.setUint16(offset, bytes.byteLength, true)
  target.set(bytes, offset + 2)
  return offset + 2 + bytes.byteLength
}

function readCountedString(
  bytes: Uint8Array,
  view: DataView,
  offset: number
): { value: string; next: number } {
  if (offset + 2 > bytes.byteLength) {
    throw new DataScopeError('INVALID_FORMAT', 'DSB 字符串字段不完整')
  }
  const length = view.getUint16(offset, true)
  const start = offset + 2
  const end = start + length
  if (end > bytes.byteLength) {
    throw new DataScopeError('INVALID_FORMAT', 'DSB 字符串字段不完整')
  }
  try {
    const value = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(start, end))
    return { value, next: end }
  } catch {
    throw new DataScopeError('INVALID_FORMAT', 'DSB 字符串不是合法 UTF-8')
  }
}

function fileNameFromPath(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  const fileName = parts[parts.length - 1] || 'dataset'
  return fileName.replace(/\.dsb$/i, '')
}
