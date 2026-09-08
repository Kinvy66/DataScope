import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ChannelStatistics, DatasetInfo } from '@shared/types/dataset'
import type { SourceFormat } from '@shared/types/dataset'
import { getErrorMessage } from '../utils/format'
import { useAppStore } from './app'
import { useProjectStore } from './project'

export const useDatasetStore = defineStore('dataset', () => {
  const datasets = ref<DatasetInfo[]>([])
  const selectedId = ref<string | null>(null)
  const statistics = ref<ChannelStatistics[]>([])
  const busy = ref(false)

  const selected = computed(
    () => datasets.value.find((item) => item.id === selectedId.value) ?? null
  )

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

  async function removeSelected(): Promise<void> {
    if (!selectedId.value) return
    await window.datascope.dataset.remove(selectedId.value)
    await useProjectStore().hydrate()
    await refresh()
  }

  return {
    datasets,
    selectedId,
    selected,
    statistics,
    busy,
    refresh,
    select,
    importData,
    removeSelected
  }
})

function inferFormat(filePath: string): SourceFormat {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.txt')) return 'txt'
  return 'csv'
}
