import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { mergeAppSettings, validateSettingsPatch } from '@shared/settings/validate'
import { DEFAULT_SETTINGS } from '@shared/types/settings'

describe('mergeAppSettings', () => {
  it('fills missing fields from defaults', () => {
    const merged = mergeAppSettings({ theme: 'light', language: 'en-US' })
    expect(merged.theme).toBe('light')
    expect(merged.language).toBe('en-US')
    expect(merged.autosaveIntervalSec).toBe(DEFAULT_SETTINGS.autosaveIntervalSec)
    expect(merged.defaultSampleRate).toBe(DEFAULT_SETTINGS.defaultSampleRate)
    expect(merged.defaultChannelCount).toBe(DEFAULT_SETTINGS.defaultChannelCount)
    expect(merged.defaultExportFormat).toBe(DEFAULT_SETTINGS.defaultExportFormat)
    expect(merged.viewportCacheLimit).toBe(DEFAULT_SETTINGS.viewportCacheLimit)
  })

  it('drops unknown keys and invalid values', () => {
    const merged = mergeAppSettings({
      theme: 'neon',
      language: 'fr-FR',
      defaultSampleRate: -1,
      defaultChannelCount: 99,
      autosaveIntervalSec: 15,
      viewportCacheLimit: 7,
      extra: true
    })
    expect(merged.theme).toBe('dark')
    expect(merged.language).toBe('zh-CN')
    expect(merged.defaultSampleRate).toBe(DEFAULT_SETTINGS.defaultSampleRate)
    expect(merged.defaultChannelCount).toBe(DEFAULT_SETTINGS.defaultChannelCount)
    expect(merged.autosaveIntervalSec).toBe(0)
    expect(merged.viewportCacheLimit).toBe(16)
    expect(merged).not.toHaveProperty('extra')
  })
})

describe('validateSettingsPatch', () => {
  it('accepts a legal patch', () => {
    expect(() =>
      validateSettingsPatch({
        language: 'en-US',
        autosaveIntervalSec: 60,
        defaultSampleRate: 2000,
        defaultChannelCount: 8,
        defaultExportFormat: 'json',
        viewportCacheLimit: 32
      })
    ).not.toThrow()
  })

  it('rejects an invalid sample rate', () => {
    expect(() => validateSettingsPatch({ defaultSampleRate: 0 })).toThrow(DataScopeError)
  })

  it('rejects an unknown autosave interval', () => {
    expect(() => validateSettingsPatch({ autosaveIntervalSec: 45 as never })).toThrow(DataScopeError)
  })
})
