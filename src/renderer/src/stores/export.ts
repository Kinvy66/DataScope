import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { EXPORT_FORMATS, type ExportFormat, type ExportResult } from '@shared/types/export'
import type { AppSettings } from '@shared/types/settings'
import { tt } from '../i18n'
import { getErrorMessage } from '../utils/format'
import { useAppStore } from './app'
import { useDatasetStore } from './dataset'
import { useProjectStore } from './project'

export const useExportStore = defineStore('export', () => {
  const format = ref<ExportFormat>('csv')
  const fileName = ref('')
  const selectedChannelIds = ref<string[]>([])
  const startIndex = ref(0)
  const endIndex = ref(0)
  const result = ref<ExportResult | null>(null)
  const busy = ref(false)

  const datasetStore = useDatasetStore()
  const projectStore = useProjectStore()

  const sampleCount = computed(() => Math.max(endIndex.value - startIndex.value + 1, 0))

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
      fileName.value = ''
      return
    }
    selectedChannelIds.value = dataset.channels.map((channel) => channel.id)
    startIndex.value = 0
    endIndex.value = Math.max(dataset.sampleCount - 1, 0)
    fileName.value = dataset.name
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
      useAppStore().setGlobalError(tt('error.needDataset'))
      return
    }
    if (selectedChannelIds.value.length === 0) {
      useAppStore().setGlobalError(tt('error.needChannels'))
      return
    }

    busy.value = true
    try {
      result.value = await window.datascope.dataset.export({
        datasetId: dataset.id,
        format: format.value,
        channelIds: [...selectedChannelIds.value],
        startIndex: startIndex.value,
        endIndex: endIndex.value,
        fileName: fileName.value.trim() || dataset.name
      })
      useAppStore().setGlobalError(null)
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
      if (message !== '任务已取消') {
        await window.datascope.log.write({ level: 'ERROR', message })
      }
    } finally {
      busy.value = false
    }
  }

  function applyDefaults(settings: AppSettings): void {
    format.value = settings.defaultExportFormat
  }

  return {
    format,
    fileName,
    selectedChannelIds,
    startIndex,
    endIndex,
    result,
    busy,
    sampleCount,
    canRun,
    formats: EXPORT_FORMATS,
    syncFromDataset,
    useFullRange,
    toggleChannel,
    selectAllChannels,
    run,
    applyDefaults
  }
})
