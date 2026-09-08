<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import { FFT_SIZES } from '@shared/algorithms/fft'
import SpectrumPlot from '../components/spectrum/SpectrumPlot.vue'
import { useI18n } from '../i18n'
import { useDatasetStore } from '../stores/dataset'
import { useProjectStore } from '../stores/project'
import { useSpectrumStore } from '../stores/spectrum'
import { elapsedSeconds } from '@shared/markers/manage'
import { formatNumber, formatPath, formatTimestamp } from '../utils/format'

const router = useRouter()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const spectrumStore = useSpectrumStore()
const { t } = useI18n()

const dataset = computed(() => datasetStore.selected)

function indexToTime(index: number): number {
  if (!dataset.value) return 0
  return elapsedSeconds(dataset.value.sampleRate, index)
}

const windowLabel = computed(() => {
  if (!dataset.value) return '—'
  const start = indexToTime(spectrumStore.startIndex)
  const end = indexToTime(spectrumStore.endIndex)
  const samples = Math.max(spectrumStore.endIndex - spectrumStore.startIndex + 1, 0)
  return `${formatNumber(start, 6)} s → ${formatNumber(end, 6)} s · ${samples.toLocaleString()} samples`
})

const plotValues = computed(() => {
  const channel = spectrumStore.plotted
  if (!channel) return []
  return spectrumStore.scale === 'power' ? channel.powers : channel.magnitudes
})

const plotColor = computed(() => {
  const id = spectrumStore.plotted?.channelId
  return dataset.value?.channels.find((channel) => channel.id === id)?.color ?? '#3ee0c5'
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('spectrum.kicker') }}</div>
      <h1>{{ t('spectrum.title') }}</h1>
      <p>{{ t('spectrum.desc') }}</p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>{{ t('spectrum.needProject') }}</p>
    </div>

    <div v-else-if="!dataset" class="panel empty-state">
      <p>{{ t('spectrum.noDataset') }}</p>
      <button class="btn btn-primary" type="button" @click="router.push('/data')">
        <AppIcon name="database" />
        {{ t('common.goData') }}
      </button>
    </div>

    <template v-else>
      <div class="layout">
        <aside class="panel controls">
          <h2>{{ dataset.name }}</h2>
          <p class="muted">
            {{ dataset.channelCount }} ch · {{ dataset.sampleCount.toLocaleString() }} samples ·
            {{ formatNumber(dataset.sampleRate, 3) }} Hz
          </p>

          <div class="field">
            <label>{{ t('signal.channels') }}</label>
            <div class="channels">
              <label v-for="channel in dataset.channels" :key="channel.id" class="channel">
                <input
                  type="checkbox"
                  :checked="spectrumStore.selectedChannelIds.includes(channel.id)"
                  @change="spectrumStore.toggleChannel(channel.id)"
                />
                <span class="dot" :style="{ background: channel.color }"></span>
                {{ channel.name }}
              </label>
            </div>
            <button class="btn btn-ghost" type="button" @click="spectrumStore.selectAllChannels()">
              <AppIcon name="checkSquare" />
              {{ t('common.selectAllChannels') }}
            </button>
          </div>

          <div class="range">
            <div class="field">
              <label for="spec-start">{{ t('common.startIndex') }}</label>
              <input
                id="spec-start"
                v-model.number="spectrumStore.startIndex"
                type="number"
                min="0"
                :max="dataset.sampleCount - 1"
              />
            </div>
            <div class="field">
              <label for="spec-end">{{ t('common.endIndex') }}</label>
              <input
                id="spec-end"
                v-model.number="spectrumStore.endIndex"
                type="number"
                min="0"
                :max="dataset.sampleCount - 1"
              />
            </div>
            <div class="field">
              <label for="fft-size">{{ t('spectrum.fftSize') }}</label>
              <select id="fft-size" v-model.number="spectrumStore.fftSize">
                <option v-for="size in FFT_SIZES" :key="size" :value="size">{{ size }}</option>
              </select>
            </div>
            <div class="field">
              <label for="fft-window">{{ t('spectrum.window') }}</label>
              <select id="fft-window" v-model="spectrumStore.windowType">
                <option value="rectangular">Rectangular</option>
                <option value="hann">Hann</option>
                <option value="hamming">Hamming</option>
                <option value="blackman">Blackman</option>
              </select>
            </div>
          </div>
          <p class="muted">{{ windowLabel }}</p>
          <div class="row">
            <button class="btn" type="button" @click="spectrumStore.useFullRange()">
              <AppIcon name="maximize" />
              {{ t('common.fullRange') }}
            </button>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!spectrumStore.canRun"
              @click="spectrumStore.run()"
            >
              <AppIcon name="play" />
              {{ spectrumStore.busy ? t('spectrum.running') : t('spectrum.run') }}
            </button>
          </div>
        </aside>

        <article class="panel results">
          <div class="results-head">
            <h2>{{ t('spectrum.plot') }}</h2>
            <div class="row compact">
              <label class="inline">
                {{ t('spectrum.show') }}
                <select v-model="spectrumStore.scale">
                  <option value="magnitude">{{ t('spectrum.magnitude') }}</option>
                  <option value="power">{{ t('spectrum.power') }}</option>
                </select>
              </label>
              <label v-if="spectrumStore.result" class="inline">
                {{ t('spectrum.plotChannel') }}
                <select v-model="spectrumStore.plotChannelId">
                  <option
                    v-for="channel in spectrumStore.result.channels"
                    :key="channel.channelId"
                    :value="channel.channelId"
                  >
                    {{ channel.channelName }}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <template v-if="spectrumStore.result && spectrumStore.plotted">
            <p class="muted">
              {{
                t('spectrum.meta', {
                  time: formatTimestamp(spectrumStore.result.computedAt),
                  size: spectrumStore.result.fftSize,
                  df: formatNumber(spectrumStore.result.frequencyResolution, 4),
                  nyquist: formatNumber(spectrumStore.result.nyquist, 3)
                })
              }}
            </p>
            <SpectrumPlot
              :frequencies="spectrumStore.plotted.frequencies"
              :values="plotValues"
              :color="plotColor"
              :peak-frequency="spectrumStore.plotted.peakFrequency"
              :y-label="spectrumStore.scale === 'power' ? 'Power' : 'Magnitude'"
            />
            <table class="table">
              <thead>
                <tr>
                  <th>{{ t('common.channel') }}</th>
                  <th>{{ t('spectrum.peakFrequency') }}</th>
                  <th>{{ t('spectrum.peakMagnitude') }}</th>
                  <th>{{ t('spectrum.peakPower') }}</th>
                  <th>{{ t('spectrum.usedSamples') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in spectrumStore.result.channels" :key="row.channelId">
                  <td>{{ row.channelName }}</td>
                  <td>{{ formatNumber(row.peakFrequency, 4) }} Hz</td>
                  <td>{{ formatNumber(row.peakMagnitude) }}</td>
                  <td>{{ formatNumber(row.peakPower) }}</td>
                  <td>{{ row.usedSamples.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="spectrumStore.result.outputPath" class="muted">
              {{ t('signal.written', { path: formatPath(spectrumStore.result.outputPath) }) }}
            </p>
          </template>
          <p v-else class="muted">{{ t('spectrum.empty') }}</p>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.controls,
.results {
  padding: 16px;
  overflow: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.channels {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  max-height: 180px;
  overflow: auto;
}

.channel {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.range {
  display: grid;
  gap: 8px;
  margin: 12px 0 8px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.row.compact {
  margin-top: 0;
  flex-wrap: wrap;
  align-items: center;
}

.results-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.inline select {
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-panel-alt);
  padding: 0 8px;
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
