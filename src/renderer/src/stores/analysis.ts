import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { AnalysisResult } from '@shared/types/analysis'
import { getErrorMessage } from '../utils/format'
import { useAppStore } from './app'
import { useDatasetStore } from './dataset'
import { useProjectStore } from './project'

export const useAnalysisStore = defineStore('analysis', () => {
  const selectedChannelIds = ref<string[]>([])
  const startIndex = ref(0)
  const endIndex = ref(0)
  const result = ref<AnalysisResult | null>(null)
  const busy = ref(false)

  const datasetStore = useDatasetStore()
  const projectStore = useProjectStore()

  const canRun = computed(() => {
    return (
      projectStore.hasProject &&
      datasetStore.selected !== null &&
      selectedChannelIds.value.length > 0 &&
      !busy.value
    )
  })

  watch(
    () => datasetStore.selectedId,
    () => {
      syncFromDataset()
    },
    { immediate: true }
  )

  function syncFromDataset(): void {
    const dataset = datasetStore.selected
    result.value = null
    if (!dataset) {
      selectedChannelIds.value = []
      startIndex.value = 0
      endIndex.value = 0
      return
    }
    selectedChannelIds.value = dataset.channels.map((channel) => channel.id)
    startIndex.value = 0
    endIndex.value = Math.max(dataset.sampleCount - 1, 0)
  }

  function useFullRange(): void {
    const dataset = datasetStore.selected
    if (!dataset) return
    startIndex.value = 0
    endIndex.value = Math.max(dataset.sampleCount - 1, 0)
  }

  function toggleChannel(channelId: string): void {
    if (selectedChannelIds.value.includes(channelId)) {
      selectedChannelIds.value = selectedChannelIds.value.filter((id) => id !== channelId)
      return
    }
    selectedChannelIds.value = [...selectedChannelIds.value, channelId]
  }

  function selectAllChannels(): void {
    selectedChannelIds.value = datasetStore.selected?.channels.map((channel) => channel.id) ?? []
  }

  async function run(): Promise<void> {
    const dataset = datasetStore.selected
    if (!dataset) {
      useAppStore().setGlobalError('请先导入并选择一个数据集')
      return
    }
    if (selectedChannelIds.value.length === 0) {
      useAppStore().setGlobalError('请至少选择一个通道')
      return
    }

    busy.value = true
    try {
      result.value = await window.datascope.dataset.analyze({
        datasetId: dataset.id,
        channelIds: [...selectedChannelIds.value],
        startIndex: startIndex.value,
        endIndex: endIndex.value
      })
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
    selectedChannelIds,
    startIndex,
    endIndex,
    result,
    busy,
    canRun,
    syncFromDataset,
    useFullRange,
    toggleChannel,
    selectAllChannels,
    run
  }
})
