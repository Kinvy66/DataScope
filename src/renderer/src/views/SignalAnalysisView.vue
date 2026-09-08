<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import { elapsedSeconds } from '@shared/markers/manage'
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
      <div class="kicker">Signal Analysis</div>
      <h1>信号分析</h1>
      <p>
        对选定通道计算时域统计，或应用去直流 / 低通 / 高通 / 带通 / 陷波，滤波结果保存为新的数据集。
      </p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>请先新建或打开工程，并导入数据集后再进行分析。</p>
    </div>

    <div v-else-if="!dataset" class="panel empty-state">
      <p>当前工程还没有可分析的数据集。</p>
      <button class="btn btn-primary" type="button" @click="router.push('/data')">
        <AppIcon name="database" />
        前往数据浏览
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
            <button class="btn btn-ghost" type="button" @click="analysisStore.selectAllChannels()">
              <AppIcon name="checkSquare" />
              全选通道
            </button>
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
            <button class="btn" type="button" @click="analysisStore.useFullRange()">
              <AppIcon name="maximize" />
              全范围
            </button>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!analysisStore.canRun"
              @click="analysisStore.run()"
            >
              <AppIcon name="play" />
              {{ analysisStore.busy ? '分析中…' : '运行分析' }}
            </button>
          </div>

          <h2 class="section">数字滤波</h2>
          <div class="field">
            <label for="filter-kind">类型</label>
            <select id="filter-kind" v-model="filterStore.kind">
              <option value="dc-remove">去直流</option>
              <option value="lowpass">低通</option>
              <option value="highpass">高通</option>
              <option value="bandpass">带通</option>
              <option value="notch">陷波</option>
            </select>
          </div>
          <div v-if="filterStore.needsCutoff" class="field">
            <label for="filter-cutoff">截止频率 (Hz)</label>
            <input id="filter-cutoff" v-model.number="filterStore.cutoffHz" type="number" min="0.0001" step="any" />
          </div>
          <template v-if="filterStore.needsBand">
            <div class="field">
              <label for="filter-low">下限频率 (Hz)</label>
              <input id="filter-low" v-model.number="filterStore.lowHz" type="number" min="0.0001" step="any" />
            </div>
            <div class="field">
              <label for="filter-high">上限频率 (Hz)</label>
              <input id="filter-high" v-model.number="filterStore.highHz" type="number" min="0.0001" step="any" />
            </div>
          </template>
          <template v-if="filterStore.needsNotch">
            <div class="field">
              <label for="filter-freq">陷波频率 (Hz)</label>
              <input id="filter-freq" v-model.number="filterStore.frequencyHz" type="number" min="0.0001" step="any" />
            </div>
            <div class="field">
              <label for="filter-q">品质因数 Q</label>
              <input id="filter-q" v-model.number="filterStore.q" type="number" min="0.1" max="200" step="any" />
            </div>
          </template>
          <p class="muted">
            {{ filterStore.label }}
            <span v-if="filterStore.nyquist > 0">
              · 奈奎斯特 {{ formatNumber(filterStore.nyquist, 3) }} Hz
            </span>
          </p>
          <p class="muted">二阶 Butterworth（陷波为 IIR notch）。未勾选的通道原样复制。结果写入工程 data 目录。</p>
          <div class="row">
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!filterStore.canApply"
              @click="filterStore.apply()"
            >
              <AppIcon name="filter" />
              {{ filterStore.busy ? '滤波中…' : '应用滤波并保存' }}
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

          <template v-if="filterStore.result">
            <h2 class="section">滤波结果</h2>
            <p>
              已生成数据集 <strong>{{ filterStore.result.name }}</strong>
              · {{ filterStore.result.channelCount }} ch ·
              {{ filterStore.result.sampleCount.toLocaleString() }} samples
            </p>
            <div class="row">
              <button class="btn" type="button" @click="router.push('/data')">
                <AppIcon name="database" />
                打开数据浏览
              </button>
              <button class="btn" type="button" @click="router.push('/spectrum')">
                <AppIcon name="chartBar" />
                去频谱验证
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
