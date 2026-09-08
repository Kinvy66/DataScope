import type { AppLanguage } from '../types/settings'
import { messages, type MessageKey } from './messages'

export function translate(
  locale: AppLanguage,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const entry = messages[key]
  const template = entry[locale] ?? entry['zh-CN']
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}

export type { MessageKey }
export {
  DAQ_COMMAND_MESSAGE_KEYS,
  DAQ_STATE_MESSAGE_KEYS,
  FILTER_KIND_MESSAGE_KEYS,
  MARKER_TYPE_MESSAGE_KEYS,
  TASK_COMMAND_MESSAGE_KEYS,
  TASK_KIND_MESSAGE_KEYS,
  TASK_STATUS_MESSAGE_KEYS,
  WAVEFORM_MESSAGE_KEYS,
  messages
} from './messages'
