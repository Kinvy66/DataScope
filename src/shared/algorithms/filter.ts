import { DataScopeError } from '../errors'
import { FILTER_KINDS, type FilterKind, type FilterSpec } from '../types/filter'

export const BUTTERWORTH_Q = 1 / Math.SQRT2

export interface BiquadCoeffs {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

export function isFilterKind(value: string): value is FilterKind {
  return (FILTER_KINDS as readonly string[]).includes(value)
}

export function nyquistHz(sampleRate: number): number {
  return sampleRate / 2
}

export function describeFilter(spec: FilterSpec): string {
  switch (spec.kind) {
    case 'dc-remove':
      return '去直流'
    case 'lowpass':
      return `低通 ${formatHz(spec.cutoffHz)}`
    case 'highpass':
      return `高通 ${formatHz(spec.cutoffHz)}`
    case 'bandpass':
      return `带通 ${formatHz(spec.lowHz)}-${formatHz(spec.highHz)}`
    case 'notch':
      return `陷波 ${formatHz(spec.frequencyHz)}`
  }
}

export function validateFilterSpec(spec: FilterSpec, sampleRate: number): FilterSpec {
  if (!isFilterKind(spec.kind)) {
    throw new DataScopeError('VALIDATION_ERROR', `不支持的滤波类型: ${spec.kind}`)
  }
  if (!(sampleRate > 0) || !Number.isFinite(sampleRate)) {
    throw new DataScopeError('VALIDATION_ERROR', '采样率必须大于 0')
  }

  if (spec.kind === 'dc-remove') {
    return spec
  }

  if (spec.kind === 'lowpass' || spec.kind === 'highpass') {
    assertBelowNyquist(spec.cutoffHz, sampleRate, '截止频率')
    return spec
  }

  if (spec.kind === 'bandpass') {
    assertBelowNyquist(spec.lowHz, sampleRate, '下限频率')
    assertBelowNyquist(spec.highHz, sampleRate, '上限频率')
    if (!(spec.lowHz < spec.highHz)) {
      throw new DataScopeError('VALIDATION_ERROR', '带通下限必须小于上限')
    }
    return spec
  }

  assertBelowNyquist(spec.frequencyHz, sampleRate, '陷波频率')
  if (!(spec.q > 0) || !Number.isFinite(spec.q)) {
    throw new DataScopeError('VALIDATION_ERROR', '品质因数 Q 必须大于 0')
  }
  if (spec.q > 200) {
    throw new DataScopeError('VALIDATION_ERROR', '品质因数 Q 不能大于 200')
  }
  return spec
}

export function applyFilter(values: number[], sampleRate: number, spec: FilterSpec): number[] {
  const valid = validateFilterSpec(spec, sampleRate)
  if (values.length === 0) {
    return []
  }

  if (valid.kind === 'dc-remove') {
    return removeDc(values)
  }

  if (valid.kind === 'lowpass') {
    return applyBiquad(values, designLowpass(sampleRate, valid.cutoffHz, BUTTERWORTH_Q))
  }
  if (valid.kind === 'highpass') {
    return applyBiquad(values, designHighpass(sampleRate, valid.cutoffHz, BUTTERWORTH_Q))
  }
  if (valid.kind === 'bandpass') {
    const highpassed = applyBiquad(values, designHighpass(sampleRate, valid.lowHz, BUTTERWORTH_Q))
    return applyBiquad(highpassed, designLowpass(sampleRate, valid.highHz, BUTTERWORTH_Q))
  }
  return applyBiquad(values, designNotch(sampleRate, valid.frequencyHz, valid.q))
}

export function removeDc(values: number[]): number[] {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.map((value) => value - mean)
}

export function designLowpass(sampleRate: number, cutoffHz: number, q: number): BiquadCoeffs {
  const { cs, alpha } = rbjParams(sampleRate, cutoffHz, q)
  const b0 = (1 - cs) / 2
  const b1 = 1 - cs
  const b2 = (1 - cs) / 2
  const a0 = 1 + alpha
  const a1 = -2 * cs
  const a2 = 1 - alpha
  return normalize(b0, b1, b2, a0, a1, a2)
}

export function designHighpass(sampleRate: number, cutoffHz: number, q: number): BiquadCoeffs {
  const { cs, alpha } = rbjParams(sampleRate, cutoffHz, q)
  const b0 = (1 + cs) / 2
  const b1 = -(1 + cs)
  const b2 = (1 + cs) / 2
  const a0 = 1 + alpha
  const a1 = -2 * cs
  const a2 = 1 - alpha
  return normalize(b0, b1, b2, a0, a1, a2)
}

export function designNotch(sampleRate: number, frequencyHz: number, q: number): BiquadCoeffs {
  const { cs, alpha } = rbjParams(sampleRate, frequencyHz, q)
  const b0 = 1
  const b1 = -2 * cs
  const b2 = 1
  const a0 = 1 + alpha
  const a1 = -2 * cs
  const a2 = 1 - alpha
  return normalize(b0, b1, b2, a0, a1, a2)
}

export function applyBiquad(values: number[], coeffs: BiquadCoeffs): number[] {
  let z1 = 0
  let z2 = 0
  const output = new Array<number>(values.length)

  for (let i = 0; i < values.length; i += 1) {
    const x = values[i]
    const y = coeffs.b0 * x + z1
    z1 = coeffs.b1 * x - coeffs.a1 * y + z2
    z2 = coeffs.b2 * x - coeffs.a2 * y
    if (!Number.isFinite(y)) {
      throw new DataScopeError('NAN_OR_INFINITY', '滤波过程出现非有限数值')
    }
    output[i] = y
  }

  return output
}

function rbjParams(sampleRate: number, frequencyHz: number, q: number): { cs: number; alpha: number } {
  const omega = (2 * Math.PI * frequencyHz) / sampleRate
  const sn = Math.sin(omega)
  const cs = Math.cos(omega)
  const alpha = sn / (2 * q)
  return { cs, alpha }
}

function normalize(
  b0: number,
  b1: number,
  b2: number,
  a0: number,
  a1: number,
  a2: number
): BiquadCoeffs {
  if (!(Math.abs(a0) > 0) || !Number.isFinite(a0)) {
    throw new DataScopeError('VALIDATION_ERROR', '滤波器系数无效')
  }
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0
  }
}

function assertBelowNyquist(frequencyHz: number, sampleRate: number, label: string): void {
  if (!(frequencyHz > 0) || !Number.isFinite(frequencyHz)) {
    throw new DataScopeError('VALIDATION_ERROR', `${label}必须大于 0`)
  }
  if (frequencyHz >= nyquistHz(sampleRate)) {
    throw new DataScopeError('VALIDATION_ERROR', `${label}必须低于奈奎斯特频率（采样率的一半）`)
  }
}

function formatHz(value: number): string {
  if (!Number.isFinite(value)) return '?'
  if (Number.isInteger(value)) return `${value}Hz`
  return `${value.toFixed(2)}Hz`
}
