import { DataScopeError } from '../errors'
import {
  GENERATOR_MAX_CHANNELS,
  GENERATOR_MAX_SAMPLES,
  GENERATOR_MIN_SAMPLES,
  WAVEFORM_KINDS,
  type GeneratorRequest
} from '../types/generator'

export function validateGeneratorRequest(input: GeneratorRequest): GeneratorRequest {
  const name = input.name.trim()
  if (!name) {
    throw new DataScopeError('VALIDATION_ERROR', '数据集名称不能为空')
  }
  if (!WAVEFORM_KINDS.includes(input.kind)) {
    throw new DataScopeError('VALIDATION_ERROR', `不支持的波形类型: ${input.kind}`)
  }
  if (!Number.isInteger(input.channelCount) || input.channelCount < 1 || input.channelCount > GENERATOR_MAX_CHANNELS) {
    throw new DataScopeError(
      'VALIDATION_ERROR',
      `通道数必须是 1–${GENERATOR_MAX_CHANNELS} 的整数`
    )
  }
  if (!(input.sampleRate > 0) || !Number.isFinite(input.sampleRate)) {
    throw new DataScopeError('VALIDATION_ERROR', '采样率必须大于 0')
  }
  if (!(input.duration > 0) || !Number.isFinite(input.duration)) {
    throw new DataScopeError('VALIDATION_ERROR', '时长必须大于 0')
  }
  if (!Number.isFinite(input.amplitude)) {
    throw new DataScopeError('VALIDATION_ERROR', '幅度必须是有限数字')
  }
  if (!Number.isFinite(input.offset)) {
    throw new DataScopeError('VALIDATION_ERROR', '偏置必须是有限数字')
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

  const sampleCount = resolveSampleCount(input.sampleRate, input.duration)
  return { ...input, name, duration: sampleCount / input.sampleRate }
}

export function resolveSampleCount(sampleRate: number, duration: number): number {
  const sampleCount = Math.round(sampleRate * duration)
  if (sampleCount < GENERATOR_MIN_SAMPLES) {
    throw new DataScopeError(
      'VALIDATION_ERROR',
      `生成数据至少需要 ${GENERATOR_MIN_SAMPLES} 个采样点`
    )
  }
  if (sampleCount > GENERATOR_MAX_SAMPLES) {
    throw new DataScopeError(
      'VALIDATION_ERROR',
      `单通道最多 ${GENERATOR_MAX_SAMPLES.toLocaleString()} 个采样点`
    )
  }
  return sampleCount
}
