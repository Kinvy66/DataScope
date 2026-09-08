import { buildDataset } from '../parsers/common'
import type { Dataset } from '../types/dataset'
import type { GeneratorRequest } from '../types/generator'
import { resolveSampleCount, validateGeneratorRequest } from './validate'

export function generateDatasetFromRequest(request: GeneratorRequest): Dataset {
  const input = validateGeneratorRequest(request)
  const sampleCount = resolveSampleCount(input.sampleRate, input.duration)
  const channelNames = Array.from({ length: input.channelCount }, (_, index) => `ch${index + 1}`)
  const timestamps = Array.from({ length: sampleCount }, (_, n) => n / input.sampleRate)
  const columns = channelNames.map((_, index) => generateChannel(input, index, sampleCount))

  return buildDataset({
    name: input.name,
    table: { channelNames, timestamps, columns },
    sourcePath: `${input.name}.json`,
    sourceFormat: 'json',
    fileSize: 0,
    encoding: 'utf-8',
    sampleRateHint: input.sampleRate
  })
}

export function serializeGeneratedJson(dataset: Dataset): string {
  return JSON.stringify(
    {
      name: dataset.name,
      sampleRate: dataset.sampleRate,
      startTime: dataset.startTime,
      channelNames: dataset.channels.map((channel) => channel.name),
      samples: dataset.samples
    },
    null,
    2
  )
}

export function generateChannel(
  request: GeneratorRequest,
  channelIndex: number,
  sampleCount: number
): number[] {
  const random = mulberry32((request.seed ?? 1) + channelIndex * 997)
  const phase = (2 * Math.PI * channelIndex) / Math.max(request.channelCount, 1)
  const values = new Array<number>(sampleCount)

  for (let n = 0; n < sampleCount; n += 1) {
    const t = n / request.sampleRate
    const omega = 2 * Math.PI * request.frequency * t + phase
    let value = 0

    switch (request.kind) {
      case 'sine':
        value = request.amplitude * Math.sin(omega)
        break
      case 'square':
        value = request.amplitude * (Math.sin(omega) >= 0 ? 1 : -1)
        break
      case 'triangle':
        value = request.amplitude * ((2 / Math.PI) * Math.asin(Math.sin(omega)))
        break
      case 'dc':
        value = 0
        break
      case 'noise':
        value = (random() * 2 - 1) * request.amplitude
        break
      case 'multi-frequency':
        value =
          (request.amplitude / 3) * Math.sin(omega) +
          (request.amplitude / 3) * Math.sin(2 * omega - phase) +
          (request.amplitude / 3) * Math.sin(3 * omega + phase)
        break
    }

    value += request.offset
    if (request.kind !== 'noise' && request.noiseLevel > 0) {
      value += (random() * 2 - 1) * request.noiseLevel
    }
    values[n] = value
  }

  return values
}

function mulberry32(seed: number): () => number {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
