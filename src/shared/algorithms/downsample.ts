export interface MinMaxBucket {
  min: number
  max: number
}

/**
 * Min-Max downsampling for waveform rendering.
 * Each output bucket stores the min and max of the source samples that map to one pixel column.
 * This preserves peaks while reducing 1e6 samples to ~viewport width points.
 */
export function downsampleMinMax(
  values: number[],
  startIndex: number,
  endIndex: number,
  pixelWidth: number
): MinMaxBucket[] {
  if (pixelWidth <= 0) {
    return []
  }

  const lastIndex = values.length - 1
  const from = clamp(Math.floor(startIndex), 0, Math.max(lastIndex, 0))
  const to = clamp(Math.ceil(endIndex), from, Math.max(lastIndex, 0))
  const span = Math.max(to - from, 1)
  const bucketCount = Math.min(pixelWidth, span)
  const result: MinMaxBucket[] = new Array(bucketCount)

  if (values.length === 0) {
    return Array.from({ length: pixelWidth }, () => ({ min: 0, max: 0 }))
  }

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const bucketStart = from + Math.floor((bucket * span) / bucketCount)
    const bucketEnd = from + Math.floor(((bucket + 1) * span) / bucketCount)
    const end = Math.max(bucketEnd, bucketStart + 1)

    let min = values[bucketStart]
    let max = values[bucketStart]

    for (let i = bucketStart + 1; i < end && i <= to; i += 1) {
      const value = values[i]
      if (value < min) min = value
      if (value > max) max = value
    }

    result[bucket] = { min, max }
  }

  return result
}

export function tracesFromChannels(
  channels: Array<{ id: string; values: number[] }>,
  startIndex: number,
  endIndex: number,
  pixelWidth: number
): Array<{ channelId: string; mins: number[]; maxs: number[] }> {
  return channels.map((channel) => {
    const buckets = downsampleMinMax(channel.values, startIndex, endIndex, pixelWidth)
    return {
      channelId: channel.id,
      mins: buckets.map((bucket) => bucket.min),
      maxs: buckets.map((bucket) => bucket.max)
    }
  })
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
