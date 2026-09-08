import { DataScopeError } from '../errors'
import { CHANNEL_COLORS } from '../constants'
import { WAVEFORM_KINDS } from '../types/generator'
import {
  DEFAULT_LIVE_CONFIG,
  LIVE_MAX_BUFFER,
  LIVE_MAX_CHANNELS,
  LIVE_MAX_PACKET,
  LIVE_MIN_BUFFER,
  LIVE_MIN_PACKET,
  type LiveChannelInfo,
  type LiveConfig
} from '../types/live'

export function validateLiveConfig(input: LiveConfig): LiveConfig {
  const deviceName = input.deviceName.trim() || DEFAULT_LIVE_CONFIG.deviceName
  if (!WAVEFORM_KINDS.includes(input.kind)) {
    throw new DataScopeError('VALIDATION_ERROR', `不支持的波形类型: ${input.kind}`)
  }
  if (!Number.isInteger(input.channelCount) || input.channelCount < 1 || input.channelCount > LIVE_MAX_CHANNELS) {
    throw new DataScopeError('VALIDATION_ERROR', `通道数必须是 1–${LIVE_MAX_CHANNELS} 的整数`)
  }
  if (!(input.sampleRate > 0) || !Number.isFinite(input.sampleRate)) {
    throw new DataScopeError('VALIDATION_ERROR', '采样率必须大于 0')
  }
  if (
    !Number.isInteger(input.bufferCapacity) ||
    input.bufferCapacity < LIVE_MIN_BUFFER ||
    input.bufferCapacity > LIVE_MAX_BUFFER
  ) {
    throw new DataScopeError(
      'VALIDATION_ERROR',
      `缓冲区容量必须是 ${LIVE_MIN_BUFFER}–${LIVE_MAX_BUFFER.toLocaleString()} 的整数`
    )
  }
  if (
    !Number.isInteger(input.samplesPerPacket) ||
    input.samplesPerPacket < LIVE_MIN_PACKET ||
    input.samplesPerPacket > LIVE_MAX_PACKET
  ) {
    throw new DataScopeError(
      'VALIDATION_ERROR',
      `每包采样点数必须是 ${LIVE_MIN_PACKET}–${LIVE_MAX_PACKET} 的整数`
    )
  }
  if (input.samplesPerPacket > input.bufferCapacity) {
    throw new DataScopeError('VALIDATION_ERROR', '每包采样点数不能超过缓冲区容量')
  }
  if (!Number.isFinite(input.amplitude) || !Number.isFinite(input.offset)) {
    throw new DataScopeError('VALIDATION_ERROR', '幅度和偏置必须是有限数字')
  }
  if (!(input.noiseLevel >= 0) || !Number.isFinite(input.noiseLevel)) {
    throw new DataScopeError('VALIDATION_ERROR', '噪声水平不能为负数')
  }
  if (input.kind !== 'dc' && input.kind !== 'noise') {
    if (!(input.frequency > 0) || !Number.isFinite(input.frequency)) {
      throw new DataScopeError('VALIDATION_ERROR', '频率必须大于 0')
    }
    if (input.frequency >= input.sampleRate / 2) {
      throw new DataScopeError('VALIDATION_ERROR', '频率必须低于奈奎斯特频率（采样率的一半）')
    }
  }

  return {
    ...input,
    deviceName,
    seed: Number.isFinite(input.seed) ? input.seed : 1
  }
}

export function liveChannels(channelCount: number): LiveChannelInfo[] {
  return Array.from({ length: channelCount }, (_, index) => ({
    id: `live-ch-${index + 1}`,
    name: `CH${index + 1}`,
    color: CHANNEL_COLORS[index % CHANNEL_COLORS.length]
  }))
}
