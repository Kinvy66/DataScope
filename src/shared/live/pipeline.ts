import { decodePacket } from './packet'
import { pushSamples, type RingBufferState } from './buffer'
import type { LivePacketFields } from '../types/live'

export interface IngestState {
  lastSequence: number | null
  packetCount: number
  invalidPacketCount: number
  droppedPacketCount: number
  overflowSamples: number
}

export function createIngestState(): IngestState {
  return {
    lastSequence: null,
    packetCount: 0,
    invalidPacketCount: 0,
    droppedPacketCount: 0,
    overflowSamples: 0
  }
}

export function ingestEncodedPacket(
  buffer: RingBufferState,
  bytes: Uint8Array,
  ingest: IngestState,
  expectedChannels: number
): LivePacketFields | null {
  let packet: LivePacketFields
  try {
    packet = decodePacket(bytes)
  } catch {
    ingest.invalidPacketCount += 1
    return null
  }

  if (packet.channelCount !== expectedChannels || packet.channelCount !== buffer.channelCount) {
    ingest.invalidPacketCount += 1
    return null
  }

  if (ingest.lastSequence !== null) {
    if (packet.sequence <= ingest.lastSequence) {
      ingest.invalidPacketCount += 1
      return null
    }
    if (packet.sequence > ingest.lastSequence + 1) {
      ingest.droppedPacketCount += packet.sequence - ingest.lastSequence - 1
    }
  }

  ingest.overflowSamples += pushSamples(buffer, packet.samples)
  ingest.lastSequence = packet.sequence
  ingest.packetCount += 1
  return packet
}
