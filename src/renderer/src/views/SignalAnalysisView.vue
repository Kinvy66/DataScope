<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '../stores/analysis'
import { useDatasetStore } from '../stores/dataset'
import { useProjectStore } from '../stores/project'
import { formatDuration, formatNumber, formatPath, formatTimestamp } from '../utils/format'

const router = useRouter()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const analysisStore = useAnalysisStore()

const dataset = computed(() => datasetStore.selected)

function indexToTime(index: number): number {
  if (!dataset.value) return 0
  return dataset.value.startTime + index / dataset.value.sampleRate
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
      <div class="kicker">Signal Analysis</div>
      <h1>信号分析</h1>
      <p>对选定通道和采样区间计算 Min / Max / Mean / Median / RMS / StdDev / Peak-Peak。</p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>请先新建或打开工程，并导入数据集后再进行分析。</p>
    </div>

    <div v-else-if="!dataset" class="panel empty-state">
      <p>当前工程还没有可分析的数据集。</p>
      <button class="btn btn-primary" type="button" @click="router.push('/data')">前往数据浏览</button>
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
            <label>分析通道</label>
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
            <button class="btn btn-ghost" type="button" @click="analysisStore.selectAllChannels()">全选通道</button>
          </div>

          <div class="range">
            <div class="field">
              <label for="start-index">起始采样点</label>
              <input
                id="start-index"
                v-model.number="analysisStore.startIndex"
                type="number"
                min="0"
                :max="dataset.sampleCount - 1"
              />
            </div>
            <div class="field">
              <label for="end-index">结束采样点</label>
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
            <button class="btn" type="button" @click="analysisStore.useFullRange()">全范围</button>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!analysisStore.canRun"
              @click="analysisStore.run()"
            >
              {{ analysisStore.busy ? '分析中…' : '运行分析' }}
            </button>
          </div>
        </aside>

        <article class="panel results">
          <h2>分析结果</h2>
          <template v-if="analysisStore.result">
            <p class="muted">
              计算于 {{ formatTimestamp(analysisStore.result.computedAt) }} ·
              {{ analysisStore.result.sampleCount.toLocaleString() }} samples ·
              {{ formatDuration(analysisStore.result.duration) }}
            </p>
            <table class="table">
              <thead>
                <tr>
                  <th>通道</th>
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
              已写入 {{ formatPath(analysisStore.result.outputPath) }}
            </p>
          </template>
          <p v-else class="muted">选择通道和区间后点击“运行分析”。结果会保存到工程的 analysis 目录。</p>
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
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
