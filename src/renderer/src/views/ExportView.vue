<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import { elapsedSeconds } from '@shared/markers/manage'
import { useI18n } from '../i18n'
import { useDatasetStore } from '../stores/dataset'
import { useExportStore } from '../stores/export'
import { useProjectStore } from '../stores/project'
import { formatNumber } from '../utils/format'

const router = useRouter()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const exportStore = useExportStore()
const { t } = useI18n()

const dataset = computed(() => datasetStore.selected)

function indexToTime(index: number): number {
  if (!dataset.value) return 0
  return elapsedSeconds(dataset.value.sampleRate, index)
}

const windowLabel = computed(() => {
  if (!dataset.value) return '—'
  const start = indexToTime(exportStore.startIndex)
  const end = indexToTime(exportStore.endIndex)
  return `${formatNumber(start, 6)} s → ${formatNumber(end, 6)} s · ${exportStore.sampleCount.toLocaleString()} samples`
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('export.kicker') }}</div>
      <h1>{{ t('export.title') }}</h1>
      <p>{{ t('export.desc') }}</p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>{{ t('export.needProject') }}</p>
    </div>

    <div v-else-if="!dataset" class="panel empty-state">
      <p>{{ t('export.noDataset') }}</p>
      <button class="btn btn-primary" type="button" @click="router.push('/data')">
        <AppIcon name="database" />
        {{ t('common.goData') }}
      </button>
    </div>

    <form v-else class="layout" @submit.prevent="exportStore.run()">
      <aside class="panel controls">
        <h2>{{ dataset.name }}</h2>
        <p class="muted">
          {{ dataset.channelCount }} ch · {{ dataset.sampleCount.toLocaleString() }} samples ·
          {{ formatNumber(dataset.sampleRate, 3) }} Hz
        </p>

        <div class="field">
          <label for="export-format">{{ t('common.format') }}</label>
          <select id="export-format" v-model="exportStore.format">
            <option v-for="item in exportStore.formats" :key="item" :value="item">
              {{ item.toUpperCase() }}
            </option>
          </select>
        </div>

        <div class="field">
          <label for="export-name">{{ t('export.fileName') }}</label>
          <input id="export-name" v-model="exportStore.fileName" />
        </div>

        <div class="field">
          <label>{{ t('export.channels') }}</label>
          <div class="channels">
            <label v-for="channel in dataset.channels" :key="channel.id" class="channel">
              <input
                type="checkbox"
                :checked="exportStore.selectedChannelIds.includes(channel.id)"
                @change="exportStore.toggleChannel(channel.id)"
              />
              <span class="dot" :style="{ background: channel.color }"></span>
              {{ channel.name }}
            </label>
          </div>
          <button class="btn btn-ghost" type="button" @click="exportStore.selectAllChannels()">
            <AppIcon name="checkSquare" />
            {{ t('common.selectAllChannels') }}
          </button>
        </div>

        <div class="range">
          <div class="field">
            <label for="export-start">{{ t('common.startIndex') }}</label>
            <input
              id="export-start"
              v-model.number="exportStore.startIndex"
              type="number"
              min="0"
              :max="dataset.sampleCount - 1"
              step="1"
            />
          </div>
          <div class="field">
            <label for="export-end">{{ t('common.endIndex') }}</label>
            <input
              id="export-end"
              v-model.number="exportStore.endIndex"
              type="number"
              min="0"
              :max="dataset.sampleCount - 1"
              step="1"
            />
          </div>
        </div>
        <p class="muted">{{ windowLabel }}</p>
        <button class="btn btn-ghost" type="button" @click="exportStore.useFullRange()">{{ t('common.fullRange') }}</button>

        <div class="row">
          <button class="btn btn-primary" type="submit" data-testid="export-run" :disabled="!exportStore.canRun">
            <AppIcon name="upload" />
            {{ exportStore.busy ? t('export.busy') : t('export.run') }}
          </button>
          <button class="btn" type="button" @click="router.push('/tasks')">
            <AppIcon name="listTodo" />
            {{ t('nav.tasks') }}
          </button>
        </div>
      </aside>

      <article class="panel help">
        <h2>{{ t('common.help') }}</h2>
        <ul>
          <li>{{ t('export.help1') }}</li>
          <li>{{ t('export.help2') }}</li>
          <li>{{ t('export.help3') }}</li>
          <li>{{ t('export.help4') }}</li>
          <li>{{ t('export.help5') }}</li>
        </ul>
        <div v-if="exportStore.result" class="result" data-testid="export-result">
          <h2>{{ t('export.last') }}</h2>
          <p>{{ exportStore.result.relativePath }}</p>
          <p class="muted">
            {{ exportStore.result.channelCount }} ch ·
            {{ exportStore.result.sampleCount.toLocaleString() }} samples ·
            {{ exportStore.result.bytesWritten.toLocaleString() }} bytes
          </p>
        </div>
      </article>
    </form>
  </section>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.controls,
.help {
  padding: 16px;
  overflow: auto;
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
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 12px 0 8px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.result {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.result p {
  margin: 0 0 6px;
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
