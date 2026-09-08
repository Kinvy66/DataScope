import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { filterDatasets } from '@shared/datasets/query'
import type { ChannelStatistics, DatasetInfo, SourceFormat } from '@shared/types/dataset'
import { getErrorMessage } from '../utils/format'
import { useAppStore } from './app'
import { useProjectStore } from './project'

export const useDatasetStore = defineStore('dataset', () => {
  const datasets = ref<DatasetInfo[]>([])
  const selectedId = ref<string | null>(null)
  const statistics = ref<ChannelStatistics[]>([])
  const busy = ref(false)
  const search = ref('')

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
      useAppStore().setGlobalError('请先新建或打开工程，再导入数据')
      return
    }

    const filePath = await window.datascope.dialog.openFile(
      [
        { name: 'Data files', extensions: ['csv', 'txt', 'json'] },
        { name: 'CSV', extensions: ['csv'] },
        { name: 'TXT', extensions: ['txt'] },
        { name: 'JSON', extensions: ['json'] }
      ],
      '导入数据'
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

  return {
    datasets,
    selectedId,
    selected,
    filtered,
    statistics,
    busy,
    search,
    refresh,
    select,
    importData,
    rename,
    remove
  }
})

function inferFormat(filePath: string): SourceFormat {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.txt')) return 'txt'
  return 'csv'
}
