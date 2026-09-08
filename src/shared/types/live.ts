import type { WaveformKind } from './generator'

export const DAQ_STATES = [
  'disconnected',
  'connected',
  'ready',
  'running',
  'paused',
  'stopped',
  'error'
] as const

export type DaqState = (typeof DAQ_STATES)[number]

export const DAQ_COMMANDS = [
  'connect',
  'arm',
  'start',
  'pause',
  'resume',
  'stop',
  'disconnect',
  'reset'
] as const

export type DaqCommand = (typeof DAQ_COMMANDS)[number]

export const DAQ_STATE_LABELS: Record<DaqState, string> = {
  disconnected: '未连接',
  connected: '已连接',
  ready: '就绪',
  running: '采集中',
  paused: '已暂停',
  stopped: '已停止',
  error: '错误'
}

export const DAQ_COMMAND_LABELS: Record<DaqCommand, string> = {
  connect: '连接',
  arm: '准备',
  start: '开始',
  pause: '暂停',
  resume: '继续',
  stop: '停止',
  disconnect: '断开',
  reset: '复位'
}

export interface LiveConfig {
  deviceName: string
  channelCount: number
  sampleRate: number
  bufferCapacity: number
  samplesPerPacket: number
  kind: WaveformKind
  frequency: number
  amplitude: number
  offset: number
  noiseLevel: number
  seed: number
}

export const LIVE_DEVICE_ID = 'virtual-daq-1'

export const LIVE_MAX_CHANNELS = 16
export const LIVE_MIN_BUFFER = 256
export const LIVE_MAX_BUFFER = 200_000
export const LIVE_MIN_PACKET = 8
export const LIVE_MAX_PACKET = 512

export const DEFAULT_LIVE_CONFIG: LiveConfig = {
  deviceName: 'Virtual DAQ',
  channelCount: 2,
  sampleRate: 1000,
  bufferCapacity: 8000,
  samplesPerPacket: 40,
  kind: 'sine',
  frequency: 10,
  amplitude: 1,
  offset: 0,
  noiseLevel: 0,
  seed: 1
}

export interface LiveChannelInfo {
  id: string
  name: string
  color: string
}

export interface LiveStatus {
  state: DaqState
  deviceId: string
  deviceName: string
  channelCount: number
  sampleRate: number
  bufferCapacity: number
  bufferLength: number
  bufferFill: number
  packetCount: number
  invalidPacketCount: number
  droppedPacketCount: number
  overflowSamples: number
  sampleIndex: number
  elapsedMs: number
  transport: 'loopback'
  channels: LiveChannelInfo[]
  config: LiveConfig
  allowedCommands: DaqCommand[]
  canConfigure: boolean
  canCapture: boolean
}

export interface LiveViewportRequest {
  pixelWidth: number
}

export interface LivePacketFields {
  version: number
  sequence: number
  timestamp: number
  sampleIndex: number
  channelCount: number
  sampleCount: number
  samples: number[][]
}
