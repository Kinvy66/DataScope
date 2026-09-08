<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import { elapsedSeconds } from '@shared/markers/manage'
import { EXPORT_FORMAT_LABELS } from '@shared/types/export'
import { useDatasetStore } from '../stores/dataset'
import { useExportStore } from '../stores/export'
import { useProjectStore } from '../stores/project'
import { formatNumber } from '../utils/format'

const router = useRouter()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const exportStore = useExportStore()

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
      <div class="kicker">Export</div>
      <h1>数据导出</h1>
      <p>将当前数据集导出为 CSV / TXT / JSON，写入工程的 exports 目录。导出走任务系统，可暂停或取消。</p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>请先新建或打开工程，并导入数据集后再导出。</p>
    </div>

    <div v-else-if="!dataset" class="panel empty-state">
      <p>当前工程还没有可导出的数据集。</p>
      <button class="btn btn-primary" type="button" @click="router.push('/data')">
        <AppIcon name="database" />
        前往数据浏览
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
          <label for="export-format">格式</label>
          <select id="export-format" v-model="exportStore.format">
            <option v-for="item in exportStore.formats" :key="item" :value="item">
              {{ EXPORT_FORMAT_LABELS[item] }}
            </option>
          </select>
        </div>

        <div class="field">
          <label for="export-name">文件名（不含扩展名）</label>
          <input id="export-name" v-model="exportStore.fileName" />
        </div>

        <div class="field">
          <label>导出通道</label>
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
            全选通道
          </button>
        </div>

        <div class="range">
          <div class="field">
            <label for="export-start">起始采样点</label>
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
            <label for="export-end">结束采样点</label>
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
        <button class="btn btn-ghost" type="button" @click="exportStore.useFullRange()">全范围</button>

        <div class="row">
          <button class="btn btn-primary" type="submit" :disabled="!exportStore.canRun">
            <AppIcon name="upload" />
            {{ exportStore.busy ? '导出中…' : '导出到 exports/' }}
          </button>
          <button class="btn" type="button" @click="router.push('/tasks')">
            <AppIcon name="listTodo" />
            任务管理
          </button>
        </div>
      </aside>

      <article class="panel help">
        <h2>说明</h2>
        <ul>
          <li>CSV / TXT 表头为 <code>timestamp,通道名...</code>，可再导入。</li>
          <li>TXT 使用制表符分隔；JSON 为行主序 <code>[timestamp, ch1, ...]</code>，避免与通道主序混淆。</li>
          <li>文件写入当前工程 <code>exports/</code>，重名会自动加序号。</li>
          <li>磁盘满、没有权限或路径无效会显示错误，不会假装成功。</li>
          <li>私有二进制格式尚未支持。</li>
        </ul>
        <div v-if="exportStore.result" class="result">
          <h2>最近一次导出</h2>
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
