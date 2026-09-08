import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DEFAULT_SETTINGS, type AppSettings } from '@shared/types/settings'
import type { AppInfo } from '@shared/types/app'
import { useProjectStore } from './project'
import { useDatasetStore } from './dataset'
import { useLogStore } from './log'

export const useAppStore = defineStore('app', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS, recentProjects: [] })
  const info = ref<AppInfo | null>(null)
  const ready = ref(false)
  const globalError = ref<string | null>(null)
  const closeDialogOpen = ref(false)

  const theme = computed(() => settings.value.theme)

  async function initialize(): Promise<void> {
    settings.value = await window.datascope.settings.get()
    applyTheme(settings.value.theme)
    info.value = await window.datascope.app.getInfo()
    const projectStore = useProjectStore()
    const datasetStore = useDatasetStore()
    const logStore = useLogStore()
    await projectStore.hydrate()
    await datasetStore.refresh()
    await logStore.refresh()
    window.datascope.app.onCloseRequested(() => {
      closeDialogOpen.value = true
    })
    window.addEventListener('keydown', onKeydown)
    ready.value = true
    await window.datascope.log.write({
      level: 'INFO',
      message: 'Renderer initialized'
    })
  }

  async function setTheme(themeMode: AppSettings['theme']): Promise<void> {
    settings.value = await window.datascope.settings.set({ theme: themeMode })
    applyTheme(themeMode)
  }

  async function updateSettings(partial: Partial<AppSettings>): Promise<void> {
    settings.value = await window.datascope.settings.set(partial)
    applyTheme(settings.value.theme)
  }

  function setGlobalError(message: string | null): void {
    globalError.value = message
  }

  async function confirmClose(action: 'save' | 'discard' | 'cancel'): Promise<void> {
    const projectStore = useProjectStore()
    if (action === 'cancel') {
      closeDialogOpen.value = false
      await window.datascope.app.cancelClose()
      return
    }
    if (action === 'save') {
      await projectStore.save()
    } else {
      await projectStore.close('discard')
    }
    closeDialogOpen.value = false
    await window.datascope.app.confirmClose()
  }

  function onKeydown(event: KeyboardEvent): void {
    const modifier = event.ctrlKey || event.metaKey
    if (!modifier) return
    const projectStore = useProjectStore()
    const datasetStore = useDatasetStore()
    const key = event.key.toLowerCase()
    if (key === 'n') {
      event.preventDefault()
      projectStore.openCreateDialog()
    } else if (key === 'o') {
      event.preventDefault()
      void projectStore.openProject()
    } else if (key === 's' && event.shiftKey) {
      event.preventDefault()
      void projectStore.saveAs()
    } else if (key === 's') {
      event.preventDefault()
      void projectStore.save()
    } else if (key === 'w') {
      event.preventDefault()
      void projectStore.requestClose()
    } else if (key === 'i') {
      event.preventDefault()
      void datasetStore.importData()
    }
  }

  return {
    settings,
    info,
    ready,
    globalError,
    closeDialogOpen,
    theme,
    initialize,
    setTheme,
    updateSettings,
    setGlobalError,
    confirmClose
  }
})

function applyTheme(theme: AppSettings['theme']): void {
  document.documentElement.dataset.theme = theme
}
