import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ProjectState } from '@shared/types/project'
import { getErrorMessage } from '../utils/format'
import { useDatasetStore } from './dataset'
import { useAppStore } from './app'

export const useProjectStore = defineStore('project', () => {
  const current = ref<ProjectState | null>(null)
  const recent = ref<string[]>([])
  const createDialogOpen = ref(false)
  const closeDialogOpen = ref(false)
  const busy = ref(false)
  const errorMessage = ref<string | null>(null)

  const hasProject = computed(() => current.value !== null)
  const isDirty = computed(() => current.value?.dirty === true)
  const projectName = computed(() => current.value?.file.name ?? '未打开工程')

  async function hydrate(): Promise<void> {
    current.value = await window.datascope.project.getCurrent()
    recent.value = await window.datascope.project.getRecent()
  }

  function openCreateDialog(): void {
    createDialogOpen.value = true
  }

  function closeCreateDialog(): void {
    createDialogOpen.value = false
  }

  async function create(input: { name: string; location: string; description: string }): Promise<void> {
    await run(async () => {
      current.value = await window.datascope.project.create(input)
      recent.value = await window.datascope.project.getRecent()
      createDialogOpen.value = false
      await useDatasetStore().refresh()
    })
  }

  async function openProject(rootPath?: string): Promise<void> {
    if (current.value?.dirty) {
      closeDialogOpen.value = true
      pendingOpenPath.value = rootPath
      pendingAction.value = 'open'
      return
    }
    await run(async () => {
      const next = await window.datascope.project.open(rootPath)
      if (!next) return
      current.value = next
      recent.value = await window.datascope.project.getRecent()
      await useDatasetStore().refresh()
    })
  }

  async function save(): Promise<void> {
    if (!current.value) return
    await run(async () => {
      current.value = await window.datascope.project.save()
    })
  }

  async function saveAs(): Promise<void> {
    if (!current.value) return
    await run(async () => {
      current.value = await window.datascope.project.saveAs()
      recent.value = await window.datascope.project.getRecent()
    })
  }

  async function requestClose(): Promise<void> {
    if (!current.value) return
    if (current.value.dirty) {
      closeDialogOpen.value = true
      pendingAction.value = 'close'
      return
    }
    await close('discard')
  }

  async function confirmUnsaved(action: 'save' | 'discard' | 'cancel'): Promise<void> {
    if (action === 'cancel') {
      closeDialogOpen.value = false
      pendingAction.value = null
      pendingOpenPath.value = undefined
      return
    }
    closeDialogOpen.value = false
    if (pendingAction.value === 'open') {
      if (action === 'save') await save()
      else await close('discard')
      const path = pendingOpenPath.value
      pendingAction.value = null
      pendingOpenPath.value = undefined
      await openProject(path)
      return
    }
    await close(action === 'save' ? 'save' : 'discard')
  }

  async function close(action: 'save' | 'discard'): Promise<void> {
    await run(async () => {
      await window.datascope.project.close(action)
      current.value = null
      await useDatasetStore().refresh()
    })
  }

  async function update(input: { name?: string; description?: string; sampleRate?: number }): Promise<void> {
    await run(async () => {
      current.value = await window.datascope.project.update(input)
    })
  }

  async function clearRecent(): Promise<void> {
    await window.datascope.project.clearRecent()
    recent.value = []
  }

  async function run(task: () => Promise<void>): Promise<void> {
    busy.value = true
    errorMessage.value = null
    try {
      await task()
    } catch (error) {
      errorMessage.value = getErrorMessage(error)
      useAppStore().setGlobalError(errorMessage.value)
      await window.datascope.log.write({
        level: 'ERROR',
        message: errorMessage.value
      })
    } finally {
      busy.value = false
    }
  }

  const pendingAction = ref<'close' | 'open' | null>(null)
  const pendingOpenPath = ref<string | undefined>(undefined)

  return {
    current,
    recent,
    createDialogOpen,
    closeDialogOpen,
    busy,
    errorMessage,
    hasProject,
    isDirty,
    projectName,
    hydrate,
    openCreateDialog,
    closeCreateDialog,
    create,
    openProject,
    save,
    saveAs,
    requestClose,
    confirmUnsaved,
    close,
    update,
    clearRecent
  }
})
