import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GeneratorRequest, WaveformKind } from '@shared/types/generator'
import type { AppSettings } from '@shared/types/settings'
import { tt } from '../i18n'
import { getErrorMessage } from '../utils/format'
import { useAppStore } from './app'
import { useDatasetStore } from './dataset'
import { useProjectStore } from './project'

export const useGeneratorStore = defineStore('generator', () => {
  const name = ref('generated-sine')
  const kind = ref<WaveformKind>('sine')
  const channelCount = ref(2)
  const sampleRate = ref(1000)
  const duration = ref(1)
  const frequency = ref(50)
  const amplitude = ref(1)
  const offset = ref(0)
  const noiseLevel = ref(0)
  const busy = ref(false)

  const sampleCount = computed(() => Math.max(0, Math.round(sampleRate.value * duration.value)))
  const needsFrequency = computed(() => kind.value !== 'dc' && kind.value !== 'noise')

  function request(): GeneratorRequest {
    return {
      name: name.value,
      kind: kind.value,
      channelCount: channelCount.value,
      sampleRate: sampleRate.value,
      duration: duration.value,
      frequency: frequency.value,
      amplitude: amplitude.value,
      offset: offset.value,
      noiseLevel: noiseLevel.value,
      seed: 1
    }
  }

  async function generate(): Promise<void> {
    const projectStore = useProjectStore()
    if (!projectStore.hasProject) {
      useAppStore().setGlobalError(tt('error.needProjectGenerate'))
      return
    }

    busy.value = true
    try {
      const info = await window.datascope.dataset.generate(request())
      await projectStore.hydrate()
      const datasetStore = useDatasetStore()
      await datasetStore.refresh()
      await datasetStore.select(info.id)
      useAppStore().setGlobalError(null)
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
      await window.datascope.log.write({ level: 'ERROR', message })
    } finally {
      busy.value = false
    }
  }

  function applyDefaults(settings: AppSettings): void {
    sampleRate.value = settings.defaultSampleRate
    channelCount.value = settings.defaultChannelCount
  }

  return {
    name,
    kind,
    channelCount,
    sampleRate,
    duration,
    frequency,
    amplitude,
    offset,
    noiseLevel,
    busy,
    sampleCount,
    needsFrequency,
    generate,
    applyDefaults
  }
})
