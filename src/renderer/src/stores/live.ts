import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DaqCommand, LiveStatus } from '@shared/types/live'
import { DEFAULT_LIVE_CONFIG, LIVE_MAX_CHANNELS } from '@shared/types/live'
import type { WaveformKind } from '@shared/types/generator'
import type { AppSettings } from '@shared/types/settings'
import { tt } from '../i18n'
import { getErrorMessage } from '../utils/format'
import { useAppStore } from './app'
import { useDatasetStore } from './dataset'
import { useProjectStore } from './project'

export const useLiveStore = defineStore('live', () => {
  const status = ref<LiveStatus | null>(null)
  const busy = ref(false)
  const captureName = ref('live-capture')
  const deviceName = ref(DEFAULT_LIVE_CONFIG.deviceName)
  const channelCount = ref(DEFAULT_LIVE_CONFIG.channelCount)
  const sampleRate = ref(DEFAULT_LIVE_CONFIG.sampleRate)
  const bufferCapacity = ref(DEFAULT_LIVE_CONFIG.bufferCapacity)
  const samplesPerPacket = ref(DEFAULT_LIVE_CONFIG.samplesPerPacket)
  const kind = ref<WaveformKind>(DEFAULT_LIVE_CONFIG.kind)
  const frequency = ref(DEFAULT_LIVE_CONFIG.frequency)
  const amplitude = ref(DEFAULT_LIVE_CONFIG.amplitude)
  const offset = ref(DEFAULT_LIVE_CONFIG.offset)
  const noiseLevel = ref(DEFAULT_LIVE_CONFIG.noiseLevel)

  let unsubscribe: (() => void) | null = null

  const state = computed(() => status.value?.state ?? 'disconnected')
  const can = computed(() => new Set(status.value?.allowedCommands ?? []))
  const needsFrequency = computed(() => kind.value !== 'dc' && kind.value !== 'noise')

  function syncForm(next: LiveStatus): void {
    status.value = next
    if (!next.canConfigure) return
    deviceName.value = next.config.deviceName
    channelCount.value = next.config.channelCount
    sampleRate.value = next.config.sampleRate
    bufferCapacity.value = next.config.bufferCapacity
    samplesPerPacket.value = next.config.samplesPerPacket
    kind.value = next.config.kind
    frequency.value = next.config.frequency
    amplitude.value = next.config.amplitude
    offset.value = next.config.offset
    noiseLevel.value = next.config.noiseLevel
  }

  async function hydrate(): Promise<void> {
    status.value = await window.datascope.live.getStatus()
    syncForm(status.value)
    unsubscribe?.()
    unsubscribe = window.datascope.live.onStatus((next) => {
      status.value = next
    })
  }

  async function run(action: () => Promise<LiveStatus>): Promise<void> {
    busy.value = true
    try {
      const next = await action()
      status.value = next
      useAppStore().setGlobalError(null)
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
      await window.datascope.log.write({ level: 'ERROR', message })
    } finally {
      busy.value = false
    }
  }

  async function applyConfig(): Promise<boolean> {
    try {
      const next = await window.datascope.live.configure({
        deviceName: deviceName.value,
        channelCount: channelCount.value,
        sampleRate: sampleRate.value,
        bufferCapacity: bufferCapacity.value,
        samplesPerPacket: samplesPerPacket.value,
        kind: kind.value,
        frequency: frequency.value,
        amplitude: amplitude.value,
        offset: offset.value,
        noiseLevel: noiseLevel.value,
        seed: 1
      })
      status.value = next
      useAppStore().setGlobalError(null)
      return true
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
      await window.datascope.log.write({ level: 'ERROR', message })
      return false
    }
  }

  async function command(commandName: DaqCommand): Promise<void> {
    if (commandName === 'connect') {
      const ok = await applyConfig()
      if (!ok) return
    }
    await run(() => window.datascope.live.command(commandName))
  }

  async function capture(): Promise<void> {
    const projectStore = useProjectStore()
    if (!projectStore.hasProject) {
      useAppStore().setGlobalError(tt('error.needProjectCapture'))
      return
    }
    busy.value = true
    try {
      const info = await window.datascope.live.capture(captureName.value)
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

  async function applyDefaults(settings: AppSettings): Promise<void> {
    if (status.value && !status.value.canConfigure) return
    sampleRate.value = settings.defaultSampleRate
    channelCount.value = Math.min(LIVE_MAX_CHANNELS, Math.max(1, Math.floor(settings.defaultChannelCount)))
    try {
      const next = await window.datascope.live.configure({
        deviceName: deviceName.value,
        channelCount: channelCount.value,
        sampleRate: sampleRate.value,
        bufferCapacity: bufferCapacity.value,
        samplesPerPacket: samplesPerPacket.value,
        kind: kind.value,
        frequency: frequency.value,
        amplitude: amplitude.value,
        offset: offset.value,
        noiseLevel: noiseLevel.value,
        seed: 1
      })
      status.value = next
    } catch {
      /* Keep form values; connect will validate frequency vs Nyquist. */
    }
  }

  return {
    status,
    busy,
    captureName,
    deviceName,
    channelCount,
    sampleRate,
    bufferCapacity,
    samplesPerPacket,
    kind,
    frequency,
    amplitude,
    offset,
    noiseLevel,
    state,
    can,
    needsFrequency,
    hydrate,
    applyConfig,
    command,
    capture,
    applyDefaults
  }
})
