<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import { FILTER_KIND_MESSAGE_KEYS } from '@shared/i18n'
import { FILTER_KINDS } from '@shared/types/filter'
import { elapsedSeconds } from '@shared/markers/manage'
import { useI18n } from '../i18n'
import { useAnalysisStore } from '../stores/analysis'
import { useDatasetStore } from '../stores/dataset'
import { useFilterStore } from '../stores/filter'
import { useProjectStore } from '../stores/project'
import { formatDuration, formatNumber, formatPath, formatTimestamp } from '../utils/format'

const router = useRouter()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const analysisStore = useAnalysisStore()
const filterStore = useFilterStore()
const { t } = useI18n()

const dataset = computed(() => datasetStore.selected)

function indexToTime(index: number): number {
  if (!dataset.value) return 0
  return elapsedSeconds(dataset.value.sampleRate, index)
}

const windowLabel = computed(() => {
  if (!dataset.value) return '—'
  const start = indexToTime(analysisStore.startIndex)
  const end = indexToTime(analysisStore.endIndex)
  const samples = Math.max(analysisStore.endIndex - analysisStore.startIndex + 1, 0)
  return `${formatNumber(start, 6)} s → ${formatNumber(end, 6)} s · ${samples.toLocaleString()} samples`
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('signal.kicker') }}</div>
      <h1>{{ t('signal.title') }}</h1>
      <p>
        {{ t('signal.desc') }}
      </p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>{{ t('signal.needProject') }}</p>
    </div>

    <div v-else-if="!dataset" class="panel empty-state">
      <p>{{ t('signal.noDataset') }}</p>
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
                  :checked="analysisStore.selectedChannelIds.includes(channel.id)"
                  @change="analysisStore.toggleChannel(channel.id)"
                />
                <span class="dot" :style="{ background: channel.color }"></span>
                {{ channel.name }}
              </label>
            </div>
            <button class="btn btn-ghost" type="button" @click="analysisStore.selectAllChannels()">
              <AppIcon name="checkSquare" />
              {{ t('common.selectAllChannels') }}
            </button>
          </div>

          <div class="range">
            <div class="field">
              <label for="start-index">{{ t('common.startIndex') }}</label>
              <input
                id="start-index"
                v-model.number="analysisStore.startIndex"
                type="number"
                min="0"
                :max="dataset.sampleCount - 1"
              />
            </div>
            <div class="field">
              <label for="end-index">{{ t('common.endIndex') }}</label>
              <input
                id="end-index"
                v-model.number="analysisStore.endIndex"
                type="number"
                min="0"
                :max="dataset.sampleCount - 1"
              />
            </div>
          </div>
          <p class="muted">{{ windowLabel }}</p>
          <div class="row">
            <button class="btn" type="button" @click="analysisStore.useFullRange()">
              <AppIcon name="maximize" />
              {{ t('common.fullRange') }}
            </button>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!analysisStore.canRun"
              @click="analysisStore.run()"
            >
              <AppIcon name="play" />
              {{ analysisStore.busy ? t('signal.running') : t('signal.run') }}
            </button>
          </div>

          <h2 class="section">{{ t('signal.filter') }}</h2>
          <div class="field">
            <label for="filter-kind">{{ t('common.type') }}</label>
            <select id="filter-kind" v-model="filterStore.kind">
              <option v-for="item in FILTER_KINDS" :key="item" :value="item">{{ t(FILTER_KIND_MESSAGE_KEYS[item]) }}</option>
            </select>
          </div>
          <div v-if="filterStore.needsCutoff" class="field">
            <label for="filter-cutoff">{{ t('signal.cutoff') }}</label>
            <input id="filter-cutoff" v-model.number="filterStore.cutoffHz" type="number" min="0.0001" step="any" />
          </div>
          <template v-if="filterStore.needsBand">
            <div class="field">
              <label for="filter-low">{{ t('signal.lowHz') }}</label>
              <input id="filter-low" v-model.number="filterStore.lowHz" type="number" min="0.0001" step="any" />
            </div>
            <div class="field">
              <label for="filter-high">{{ t('signal.highHz') }}</label>
              <input id="filter-high" v-model.number="filterStore.highHz" type="number" min="0.0001" step="any" />
            </div>
          </template>
          <template v-if="filterStore.needsNotch">
            <div class="field">
              <label for="filter-freq">{{ t('signal.notchHz') }}</label>
              <input id="filter-freq" v-model.number="filterStore.frequencyHz" type="number" min="0.0001" step="any" />
            </div>
            <div class="field">
              <label for="filter-q">{{ t('signal.q') }}</label>
              <input id="filter-q" v-model.number="filterStore.q" type="number" min="0.1" max="200" step="any" />
            </div>
          </template>
          <p class="muted">
            {{ filterStore.label }}
            <span v-if="filterStore.nyquist > 0">
              · {{ t('signal.nyquist', { value: formatNumber(filterStore.nyquist, 3) }) }}
            </span>
          </p>
          <p class="muted">{{ t('signal.filterHint') }}</p>
          <div class="row">
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!filterStore.canApply"
              @click="filterStore.apply()"
            >
              <AppIcon name="filter" />
              {{ filterStore.busy ? t('signal.filtering') : t('signal.applyFilter') }}
            </button>
          </div>
        </aside>

        <article class="panel results">
          <h2>{{ t('signal.results') }}</h2>
          <template v-if="analysisStore.result">
            <p class="muted">
              {{
                t('signal.computed', {
                  time: formatTimestamp(analysisStore.result.computedAt),
                  samples: analysisStore.result.sampleCount.toLocaleString(),
                  duration: formatDuration(analysisStore.result.duration)
                })
              }}
            </p>
            <table class="table">
              <thead>
                <tr>
                  <th>{{ t('common.channel') }}</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Mean</th>
                  <th>Median</th>
                  <th>RMS</th>
                  <th>StdDev</th>
                  <th>Peak-Peak</th>
                  <th>N</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in analysisStore.result.channels" :key="row.channelId">
                  <td>{{ row.channelName }}</td>
                  <td>{{ formatNumber(row.min) }}</td>
                  <td>{{ formatNumber(row.max) }}</td>
                  <td>{{ formatNumber(row.mean) }}</td>
                  <td>{{ formatNumber(row.median) }}</td>
                  <td>{{ formatNumber(row.rms) }}</td>
                  <td>{{ formatNumber(row.stdDev) }}</td>
                  <td>{{ formatNumber(row.peakToPeak) }}</td>
                  <td>{{ row.sampleCount.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="analysisStore.result.outputPath" class="muted">
              {{ t('signal.written', { path: formatPath(analysisStore.result.outputPath) }) }}
            </p>
          </template>
          <p v-else class="muted">{{ t('signal.empty') }}</p>

          <template v-if="filterStore.result">
            <h2 class="section">{{ t('signal.filterResult') }}</h2>
            <p>
              {{
                t('signal.filterCreated', {
                  name: filterStore.result.name,
                  channels: filterStore.result.channelCount,
                  samples: filterStore.result.sampleCount.toLocaleString()
                })
              }}
            </p>
            <div class="row">
              <button class="btn" type="button" @click="router.push('/data')">
                <AppIcon name="database" />
                {{ t('signal.openData') }}
              </button>
              <button class="btn" type="button" @click="router.push('/spectrum')">
                <AppIcon name="chartBar" />
                {{ t('signal.toSpectrum') }}
              </button>
            </div>
          </template>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.controls,
.results {
  padding: 16px;
  overflow: auto;
}

h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.section {
  margin: 20px 0 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 14px;
}

.channels {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
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

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
