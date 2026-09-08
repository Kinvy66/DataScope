import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { defaultFftSize, type WindowType } from '@shared/algorithms/fft'
import type { SpectrumResult } from '@shared/types/spectrum'
import { tt } from '../i18n'
import { getErrorMessage } from '../utils/format'
import { useAppStore } from './app'
import { useDatasetStore } from './dataset'
import { useProjectStore } from './project'

export type SpectrumScale = 'magnitude' | 'power'

export const useSpectrumStore = defineStore('spectrum', () => {
  const selectedChannelIds = ref<string[]>([])
  const startIndex = ref(0)
  const endIndex = ref(0)
  const fftSize = ref(1024)
  const windowType = ref<WindowType>('hann')
  const scale = ref<SpectrumScale>('magnitude')
  const plotChannelId = ref<string | null>(null)
  const result = ref<SpectrumResult | null>(null)
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

  const plotted = computed(() => {
    if (!result.value) return null
    return (
      result.value.channels.find((channel) => channel.channelId === plotChannelId.value) ??
      result.value.channels[0] ??
      null
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
      plotChannelId.value = null
      return
    }
    selectedChannelIds.value = dataset.channels.map((channel) => channel.id)
    startIndex.value = 0
    endIndex.value = Math.max(dataset.sampleCount - 1, 0)
    fftSize.value = defaultFftSize(dataset.sampleCount)
    plotChannelId.value = dataset.channels[0]?.id ?? null
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
      result.value = await window.datascope.dataset.analyzeSpectrum({
        datasetId: dataset.id,
        channelIds: [...selectedChannelIds.value],
        startIndex: startIndex.value,
        endIndex: endIndex.value,
        fftSize: fftSize.value,
        window: windowType.value
      })
      plotChannelId.value = result.value.channels[0]?.channelId ?? plotChannelId.value
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
    fftSize,
    windowType,
    scale,
    plotChannelId,
    result,
    busy,
    canRun,
    plotted,
    syncFromDataset,
    useFullRange,
    toggleChannel,
    selectAllChannels,
    run
  }
})
