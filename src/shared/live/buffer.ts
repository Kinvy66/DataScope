export interface RingBufferState {
  capacity: number
  channelCount: number
  data: number[][]
  length: number
  writeIndex: number
}

export function createRingBuffer(channelCount: number, capacity: number): RingBufferState {
  return {
    capacity,
    channelCount,
    data: Array.from({ length: channelCount }, () => new Array<number>(capacity).fill(0)),
    length: 0,
    writeIndex: 0
  }
}

export function pushSamples(state: RingBufferState, samples: number[][]): number {
  if (samples.length !== state.channelCount) {
    throw new Error('通道数与缓冲区不一致')
  }
  const count = samples[0]?.length ?? 0
  if (count === 0) return 0
  if (samples.some((column) => column.length !== count)) {
    throw new Error('各通道采样点数不一致')
  }

  let overflow = 0
  for (let i = 0; i < count; i += 1) {
    if (state.length === state.capacity) {
      overflow += 1
    } else {
      state.length += 1
    }
    const index = state.writeIndex
    for (let channel = 0; channel < state.channelCount; channel += 1) {
      state.data[channel][index] = samples[channel][i]
    }
    state.writeIndex = (state.writeIndex + 1) % state.capacity
  }
  return overflow
}

export function linearize(state: RingBufferState): number[][] {
  const start =
    state.length === state.capacity ? state.writeIndex : (state.writeIndex - state.length + state.capacity) % state.capacity
  return state.data.map((column) => {
    const values = new Array<number>(state.length)
    for (let i = 0; i < state.length; i += 1) {
      values[i] = column[(start + i) % state.capacity]
    }
    return values
  })
}

export function bufferFill(state: RingBufferState): number {
  if (state.capacity === 0) return 0
  return state.length / state.capacity
}
