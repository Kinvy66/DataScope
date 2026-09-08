import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { filterDatasets } from '@shared/datasets/query'
import { nextMarkerName } from '@shared/markers/manage'
import { inferSourceFormat } from '@shared/parsers/format'
import type { ChannelStatistics, DatasetInfo, MarkerDraft, SourceFormat } from '@shared/types/dataset'
import { tt } from '../i18n'
import { getErrorMessage } from '../utils/format'
import { useAppStore } from './app'
import { useProjectStore } from './project'

export const useDatasetStore = defineStore('dataset', () => {
  const datasets = ref<DatasetInfo[]>([])
  const selectedId = ref<string | null>(null)
  const statistics = ref<ChannelStatistics[]>([])
  const busy = ref(false)
  const search = ref('')
  const focusSampleIndex = ref<number | null>(null)

  const selected = computed(
    () => datasets.value.find((item) => item.id === selectedId.value) ?? null
  )
  const filtered = computed(() => filterDatasets(datasets.value, search.value))

  async function refresh(): Promise<void> {
    datasets.value = await window.datascope.dataset.list()
    if (selectedId.value && !datasets.value.some((item) => item.id === selectedId.value)) {
      selectedId.value = datasets.value[0]?.id ?? null
    }
    if (!selectedId.value && datasets.value[0]) {
      selectedId.value = datasets.value[0].id
    }
    if (selectedId.value) {
      statistics.value = await window.datascope.dataset.getStatistics(selectedId.value)
    } else {
      statistics.value = []
    }
  }

  async function select(datasetId: string): Promise<void> {
    selectedId.value = datasetId
    statistics.value = await window.datascope.dataset.getStatistics(datasetId)
  }

  async function importData(): Promise<void> {
    const projectStore = useProjectStore()
    if (!projectStore.hasProject) {
      useAppStore().setGlobalError(tt('error.needProjectImport'))
      return
    }

    const filePath = await window.datascope.dialog.openFile(
      [
        { name: tt('dialog.filterData'), extensions: ['csv', 'txt', 'json', 'dsb'] },
        { name: 'CSV', extensions: ['csv'] },
        { name: 'TXT', extensions: ['txt'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'DSB', extensions: ['dsb'] }
      ],
      tt('dialog.importTitle')
    )
    if (!filePath) return

    busy.value = true
    try {
      const format = inferFormat(filePath)
      const info = await window.datascope.dataset.import(filePath, format)
      await projectStore.hydrate()
      await refresh()
      selectedId.value = info.id
      statistics.value = await window.datascope.dataset.getStatistics(info.id)
      useAppStore().setGlobalError(null)
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
      await window.datascope.log.write({ level: 'ERROR', message })
    } finally {
      busy.value = false
    }
  }

  async function rename(datasetId: string, name: string): Promise<void> {
    busy.value = true
    try {
      const info = await window.datascope.dataset.rename(datasetId, name)
      await useProjectStore().hydrate()
      await refresh()
      selectedId.value = info.id
      useAppStore().setGlobalError(null)
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
      await window.datascope.log.write({ level: 'ERROR', message })
    } finally {
      busy.value = false
    }
  }

  async function remove(datasetId: string): Promise<void> {
    busy.value = true
    try {
      await window.datascope.dataset.remove(datasetId)
      await useProjectStore().hydrate()
      await refresh()
      useAppStore().setGlobalError(null)
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
      await window.datascope.log.write({ level: 'ERROR', message })
    } finally {
      busy.value = false
    }
  }

  async function addMarker(draft: MarkerDraft): Promise<void> {
    const datasetId = selectedId.value
    if (!datasetId) {
      useAppStore().setGlobalError(tt('error.needSelectedDataset'))
      return
    }
    await runMarkerMutation(() => window.datascope.dataset.addMarker(datasetId, draft))
  }

  async function addMarkerAt(sampleIndex: number): Promise<void> {
    const current = selected.value
    if (!current) {
      useAppStore().setGlobalError(tt('error.needSelectedDataset'))
      return
    }
    await addMarker({
      name: nextMarkerName(current.markers),
      type: 'event',
      sampleIndex
    })
    focusSampleIndex.value = sampleIndex
  }

  async function updateMarker(markerId: string, draft: MarkerDraft): Promise<void> {
    const datasetId = selectedId.value
    if (!datasetId) {
      useAppStore().setGlobalError(tt('error.needSelectedDataset'))
      return
    }
    await runMarkerMutation(() => window.datascope.dataset.updateMarker(datasetId, markerId, draft))
  }

  async function removeMarker(markerId: string): Promise<void> {
    const datasetId = selectedId.value
    if (!datasetId) {
      useAppStore().setGlobalError(tt('error.needSelectedDataset'))
      return
    }
    await runMarkerMutation(() => window.datascope.dataset.removeMarker(datasetId, markerId))
  }

  async function jumpToMarker(datasetId: string, sampleIndex: number): Promise<void> {
    await select(datasetId)
    focusSampleIndex.value = sampleIndex
  }

  function clearFocus(): void {
    focusSampleIndex.value = null
  }

  async function runMarkerMutation(action: () => Promise<DatasetInfo>): Promise<void> {
    busy.value = true
    try {
      const info = await action()
      await useProjectStore().hydrate()
      await refresh()
      selectedId.value = info.id
      useAppStore().setGlobalError(null)
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
      await window.datascope.log.write({ level: 'ERROR', message })
    } finally {
      busy.value = false
    }
  }

  return {
    datasets,
    selectedId,
    selected,
    filtered,
    statistics,
    busy,
    search,
    focusSampleIndex,
    refresh,
    select,
    importData,
    rename,
    remove,
    addMarker,
    addMarkerAt,
    updateMarker,
    removeMarker,
    jumpToMarker,
    clearFocus
  }
})

function inferFormat(filePath: string): SourceFormat {
  return inferSourceFormat(filePath)
}
