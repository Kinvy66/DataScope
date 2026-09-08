export type WaveformKind = 'sine' | 'square' | 'triangle' | 'dc' | 'noise' | 'multi-frequency'

export interface GeneratorRequest {
  name: string
  kind: WaveformKind
  channelCount: number
  sampleRate: number
  duration: number
  frequency: number
  amplitude: number
  offset: number
  noiseLevel: number
  seed?: number
}

export const WAVEFORM_KINDS: WaveformKind[] = [
  'sine',
  'square',
  'triangle',
  'dc',
  'noise',
  'multi-frequency'
]

export const GENERATOR_MAX_CHANNELS = 32
export const GENERATOR_MAX_SAMPLES = 1_000_000
export const GENERATOR_MIN_SAMPLES = 4
