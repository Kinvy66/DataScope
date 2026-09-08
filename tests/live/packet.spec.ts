import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { decodePacket, encodePacket } from '@shared/live/packet'
import type { LivePacketFields } from '@shared/types/live'

function packet(partial: Partial<LivePacketFields> = {}): LivePacketFields {
  return {
    version: 1,
    sequence: 3,
    timestamp: 1.25,
    sampleIndex: 80,
    channelCount: 2,
    sampleCount: 2,
    samples: [
      [0.1, 0.2],
      [-0.1, -0.2]
    ],
    ...partial
  }
}

describe('DAQ packets', () => {
  it('round-trips header, payload and CRC', () => {
    const encoded = encodePacket(packet())
    const decoded = decodePacket(encoded)
    expect(decoded.sequence).toBe(3)
    expect(decoded.sampleIndex).toBe(80)
    expect(decoded.timestamp).toBeCloseTo(1.25)
    expect(decoded.samples[0]).toEqual([0.1, 0.2])
    expect(decoded.samples[1]).toEqual([-0.1, -0.2])
  })

  it('rejects a corrupted CRC', () => {
    const encoded = encodePacket(packet())
    encoded[encoded.length - 1] ^= 0xff
    expect(() => decodePacket(encoded)).toThrow(DataScopeError)
    try {
      decodePacket(encoded)
    } catch (error) {
      expect((error as DataScopeError).code).toBe('INVALID_FORMAT')
    }
  })

  it('rejects a bad magic header', () => {
    const encoded = encodePacket(packet())
    encoded[0] = 0
    expect(() => decodePacket(encoded)).toThrow(/魔数/)
  })
})
