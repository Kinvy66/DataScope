import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { liveChannels, validateLiveConfig } from '@shared/live/config'
import { DEFAULT_LIVE_CONFIG } from '@shared/types/live'

describe('validateLiveConfig', () => {
  it('accepts the default configuration', () => {
    const config = validateLiveConfig(DEFAULT_LIVE_CONFIG)
    expect(config.channelCount).toBe(2)
    expect(liveChannels(2).map((channel) => channel.name)).toEqual(['CH1', 'CH2'])
  })

  it('rejects Nyquist violations and oversized buffers', () => {
    expect(() => validateLiveConfig({ ...DEFAULT_LIVE_CONFIG, frequency: 500 })).toThrow(/奈奎斯特/)
    expect(() => validateLiveConfig({ ...DEFAULT_LIVE_CONFIG, bufferCapacity: 10 })).toThrow(DataScopeError)
    expect(() => validateLiveConfig({ ...DEFAULT_LIVE_CONFIG, channelCount: 0 })).toThrow(DataScopeError)
  })
})
