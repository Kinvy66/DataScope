import { describe, expect, it } from 'vitest'
import { createRingBuffer, linearize, pushSamples } from '@shared/live/buffer'
import { createIngestState, ingestEncodedPacket } from '@shared/live/pipeline'
import { encodePacket } from '@shared/live/packet'

describe('ring buffer', () => {
  it('linearizes samples in chronological order before wrapping', () => {
    const buffer = createRingBuffer(1, 4)
    pushSamples(buffer, [[1, 2, 3]])
    expect(linearize(buffer)[0]).toEqual([1, 2, 3])
  })

  it('overwrites the oldest samples and reports overflow', () => {
    const buffer = createRingBuffer(2, 4)
    const overflow = pushSamples(buffer, [
      [1, 2, 3, 4, 5],
      [10, 20, 30, 40, 50]
    ])
    expect(overflow).toBe(1)
    expect(buffer.length).toBe(4)
    expect(linearize(buffer)).toEqual([
      [2, 3, 4, 5],
      [20, 30, 40, 50]
    ])
  })
})

describe('packet ingest', () => {
  it('counts sequence gaps as dropped packets and skips duplicates', () => {
    const buffer = createRingBuffer(1, 32)
    const ingest = createIngestState()
    const first = encodePacket({
      version: 1,
      sequence: 1,
      timestamp: 0,
      sampleIndex: 0,
      channelCount: 1,
      sampleCount: 2,
      samples: [[0.1, 0.2]]
    })
    const third = encodePacket({
      version: 1,
      sequence: 3,
      timestamp: 0.004,
      sampleIndex: 4,
      channelCount: 1,
      sampleCount: 2,
      samples: [[0.3, 0.4]]
    })

    expect(ingestEncodedPacket(buffer, first, ingest, 1)).not.toBeNull()
    expect(ingestEncodedPacket(buffer, third, ingest, 1)).not.toBeNull()
    expect(ingest.packetCount).toBe(2)
    expect(ingest.droppedPacketCount).toBe(1)

    const duplicate = encodePacket({
      version: 1,
      sequence: 3,
      timestamp: 0.004,
      sampleIndex: 4,
      channelCount: 1,
      sampleCount: 2,
      samples: [[9, 9]]
    })
    expect(ingestEncodedPacket(buffer, duplicate, ingest, 1)).toBeNull()
    expect(ingest.invalidPacketCount).toBe(1)
    expect(linearize(buffer)[0]).toEqual([0.1, 0.2, 0.3, 0.4])
  })
})
