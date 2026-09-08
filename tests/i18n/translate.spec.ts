import { describe, expect, it } from 'vitest'
import { messages, translate } from '@shared/i18n'

describe('translate', () => {
  it('returns Chinese and English for the same key', () => {
    expect(translate('zh-CN', 'nav.dashboard')).toBe('工作台')
    expect(translate('en-US', 'nav.dashboard')).toBe('Dashboard')
  })

  it('interpolates variables', () => {
    expect(translate('zh-CN', 'status.project', { name: 'Demo' })).toBe('工程：Demo')
    expect(translate('en-US', 'status.project', { name: 'Demo' })).toBe('Project: Demo')
  })

  it('keeps both locales for every catalog key', () => {
    for (const key of Object.keys(messages) as Array<keyof typeof messages>) {
      const entry = messages[key]
      expect(entry['zh-CN'].length).toBeGreaterThan(0)
      expect(entry['en-US'].length).toBeGreaterThan(0)
    }
  })
})
