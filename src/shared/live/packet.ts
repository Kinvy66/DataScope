import { crc32 } from '../crypto/crc32'
import { DataScopeError } from '../errors'
import type { LivePacketFields } from '../types/live'

export const PACKET_MAGIC = 0x44534350
export const PACKET_VERSION = 1
const HEADER_BYTES = 24

export function encodePacket(fields: LivePacketFields): Uint8Array {
  if (fields.samples.length !== fields.channelCount) {
    throw new DataScopeError('VALIDATION_ERROR', '数据包通道数与 payload 不一致')
  }
  for (const column of fields.samples) {
    if (column.length !== fields.sampleCount) {
      throw new DataScopeError('VALIDATION_ERROR', '数据包采样点数与 payload 不一致')
    }
  }

  const payloadFloats = fields.channelCount * fields.sampleCount
  const bytes = new Uint8Array(HEADER_BYTES + payloadFloats * 8 + 4)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, PACKET_MAGIC)
  view.setUint8(4, fields.version)
  view.setUint8(5, fields.channelCount)
  view.setUint16(6, fields.sampleCount)
  view.setUint32(8, fields.sequence)
  view.setUint32(12, fields.sampleIndex)
  view.setFloat64(16, fields.timestamp)

  let offset = HEADER_BYTES
  for (let channel = 0; channel < fields.channelCount; channel += 1) {
    for (let sample = 0; sample < fields.sampleCount; sample += 1) {
      view.setFloat64(offset, fields.samples[channel][sample])
      offset += 8
    }
  }

  view.setUint32(offset, crc32(bytes.subarray(0, offset)))
  return bytes
}

export function decodePacket(bytes: Uint8Array): LivePacketFields {
  if (bytes.byteLength < HEADER_BYTES + 4) {
    throw new DataScopeError('INVALID_FORMAT', '数据包过短')
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const magic = view.getUint32(0)
  if (magic !== PACKET_MAGIC) {
    throw new DataScopeError('INVALID_FORMAT', '数据包魔数不正确')
  }

  const version = view.getUint8(4)
  if (version !== PACKET_VERSION) {
    throw new DataScopeError('INVALID_FORMAT', `不支持的数据包版本: ${version}`)
  }

  const channelCount = view.getUint8(5)
  const sampleCount = view.getUint16(6)
  if (channelCount < 1 || sampleCount < 1) {
    throw new DataScopeError('INVALID_FORMAT', '数据包通道数或采样点数无效')
  }

  const expected = HEADER_BYTES + channelCount * sampleCount * 8 + 4
  if (bytes.byteLength !== expected) {
    throw new DataScopeError('INVALID_FORMAT', '数据包长度与声明的通道/点数不匹配')
  }

  const crcOffset = expected - 4
  const expectedCrc = view.getUint32(crcOffset)
  const actualCrc = crc32(bytes.subarray(0, crcOffset))
  if (expectedCrc !== actualCrc) {
    throw new DataScopeError('INVALID_FORMAT', '数据包 CRC 校验失败')
  }

  const samples: number[][] = Array.from({ length: channelCount }, () => new Array<number>(sampleCount))
  let offset = HEADER_BYTES
  for (let channel = 0; channel < channelCount; channel += 1) {
    for (let sample = 0; sample < sampleCount; sample += 1) {
      const value = view.getFloat64(offset)
      if (!Number.isFinite(value)) {
        throw new DataScopeError('NAN_OR_INFINITY', '数据包包含非有限采样值')
      }
      samples[channel][sample] = value
      offset += 8
    }
  }

  return {
    version,
    sequence: view.getUint32(8),
    sampleIndex: view.getUint32(12),
    timestamp: view.getFloat64(16),
    channelCount,
    sampleCount,
    samples
  }
}
