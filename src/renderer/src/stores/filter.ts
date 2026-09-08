import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { describeFilter, nyquistHz } from '@shared/algorithms/filter'
import { DEFAULT_FILTER_SPEC, type FilterKind } from '@shared/types/filter'
import type { DatasetInfo } from '@shared/types/dataset'
import { getErrorMessage } from '../utils/format'
import { useAnalysisStore } from './analysis'
import { useAppStore } from './app'
import { useDatasetStore } from './dataset'
import { useProjectStore } from './project'

export const useFilterStore = defineStore('filter', () => {
  const kind = ref<FilterKind>(DEFAULT_FILTER_SPEC.kind)
  const cutoffHz = ref(DEFAULT_FILTER_SPEC.cutoffHz)
  const lowHz = ref(DEFAULT_FILTER_SPEC.lowHz)
  const highHz = ref(DEFAULT_FILTER_SPEC.highHz)
  const frequencyHz = ref(DEFAULT_FILTER_SPEC.frequencyHz)
  const q = ref(DEFAULT_FILTER_SPEC.q)
  const busy = ref(false)
  const result = ref<DatasetInfo | null>(null)

  const datasetStore = useDatasetStore()
  const projectStore = useProjectStore()
  const analysisStore = useAnalysisStore()

  const needsCutoff = computed(() => kind.value === 'lowpass' || kind.value === 'highpass')
  const needsBand = computed(() => kind.value === 'bandpass')
  const needsNotch = computed(() => kind.value === 'notch')
  const label = computed(() =>
    describeFilter({
      kind: kind.value,
      cutoffHz: cutoffHz.value,
      lowHz: lowHz.value,
      highHz: highHz.value,
      frequencyHz: frequencyHz.value,
      q: q.value
    })
  )
  const nyquist = computed(() => {
    const rate = datasetStore.selected?.sampleRate ?? 0
    return rate > 0 ? nyquistHz(rate) : 0
  })
  const canApply = computed(() => {
    return (
      projectStore.hasProject &&
      datasetStore.selected !== null &&
      analysisStore.selectedChannelIds.length > 0 &&
      !busy.value &&
      !analysisStore.busy
    )
  })

  async function apply(): Promise<void> {
    const dataset = datasetStore.selected
    if (!dataset) {
      useAppStore().setGlobalError('请先导入并选择一个数据集')
      return
    }
    if (analysisStore.selectedChannelIds.length === 0) {
      useAppStore().setGlobalError('请至少选择一个通道')
      return
    }

    busy.value = true
    try {
      result.value = await window.datascope.dataset.filter({
        datasetId: dataset.id,
        channelIds: [...analysisStore.selectedChannelIds],
        kind: kind.value,
        cutoffHz: Number(cutoffHz.value),
        lowHz: Number(lowHz.value),
        highHz: Number(highHz.value),
        frequencyHz: Number(frequencyHz.value),
        q: Number(q.value)
      })
      await projectStore.hydrate()
      await datasetStore.refresh()
      await datasetStore.select(result.value.id)
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
    kind,
    cutoffHz,
    lowHz,
    highHz,
    frequencyHz,
    q,
    busy,
    result,
    needsCutoff,
    needsBand,
    needsNotch,
    label,
    nyquist,
    canApply,
    apply
  }
})
