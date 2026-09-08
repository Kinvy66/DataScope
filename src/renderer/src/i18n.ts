import { computed } from 'vue'
import { translate, type MessageKey } from '@shared/i18n'
import { useAppStore } from './stores/app'

export function useI18n() {
  const appStore = useAppStore()
  const language = computed(() => appStore.settings.language)

  function t(key: MessageKey, vars?: Record<string, string | number>): string {
    return translate(language.value, key, vars)
  }

  return { t, language }
}

export function tt(key: MessageKey, vars?: Record<string, string | number>): string {
  return translate(useAppStore().settings.language, key, vars)
}
