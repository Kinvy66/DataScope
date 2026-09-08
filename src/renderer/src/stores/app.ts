import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DEFAULT_SETTINGS, type AppSettings } from '@shared/types/settings'
import type { AppInfo } from '@shared/types/app'
import { useProjectStore } from './project'
import { useDatasetStore } from './dataset'
import { useLogStore } from './log'
import { useLiveStore } from './live'
import { useTaskStore } from './task'
import { useGeneratorStore } from './generator'
import { useExportStore } from './export'

let autosaveTimer: ReturnType<typeof setInterval> | null = null

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
    applyLanguage(settings.value.language)
    info.value = await window.datascope.app.getInfo()
    const projectStore = useProjectStore()
    const datasetStore = useDatasetStore()
    const logStore = useLogStore()
    const liveStore = useLiveStore()
    const taskStore = useTaskStore()
    await projectStore.hydrate()
    await datasetStore.refresh()
    await logStore.refresh()
    await liveStore.hydrate()
    await taskStore.hydrate()
    await applyDataDefaults()
    syncAutosave()
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
    applyLanguage(settings.value.language)
    if (
      partial.defaultSampleRate !== undefined ||
      partial.defaultChannelCount !== undefined ||
      partial.defaultExportFormat !== undefined
    ) {
      await applyDataDefaults()
    }
    if (partial.autosaveIntervalSec !== undefined) {
      syncAutosave()
    }
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

function applyLanguage(language: AppSettings['language']): void {
  document.documentElement.lang = language
}

function syncAutosave(): void {
  if (autosaveTimer !== null) {
    clearInterval(autosaveTimer)
    autosaveTimer = null
  }
  const seconds = useAppStore().settings.autosaveIntervalSec
  if (seconds <= 0) return
  autosaveTimer = setInterval(() => {
    const projectStore = useProjectStore()
    if (projectStore.hasProject && projectStore.isDirty && !projectStore.busy) {
      void projectStore.save()
    }
  }, seconds * 1000)
}

async function applyDataDefaults(): Promise<void> {
  const snapshot = useAppStore().settings
  useGeneratorStore().applyDefaults(snapshot)
  useExportStore().applyDefaults(snapshot)
  await useLiveStore().applyDefaults(snapshot)
}
