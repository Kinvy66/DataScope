<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import WaveformViewer from '../components/waveform/WaveformViewer.vue'
import { MARKER_TYPE_LABELS, elapsedSeconds } from '@shared/markers/manage'
import { useDatasetStore } from '../stores/dataset'
import { useProjectStore } from '../stores/project'
import { formatDuration, formatNumber, formatTimestamp } from '../utils/format'

const router = useRouter()

const datasetStore = useDatasetStore()
const projectStore = useProjectStore()
const renamingId = ref<string | null>(null)
const renameDraft = ref('')
const pendingDeleteId = ref<string | null>(null)

const pendingDelete = computed(
  () => datasetStore.datasets.find((item) => item.id === pendingDeleteId.value) ?? null
)

function startRename(id: string, current: string): void {
  renamingId.value = id
  renameDraft.value = current
}

async function commitRename(): Promise<void> {
  if (!renamingId.value) return
  const id = renamingId.value
  const name = renameDraft.value
  renamingId.value = null
  await datasetStore.rename(id, name)
}

function cancelRename(): void {
  renamingId.value = null
}

function requestDelete(id: string): void {
  pendingDeleteId.value = id
}

async function confirmDelete(): Promise<void> {
  const id = pendingDeleteId.value
  pendingDeleteId.value = null
  if (!id) return
  await datasetStore.remove(id)
}
</script>

<template>
  <section class="page data-page">
    <header class="page-header">
      <div class="kicker">Data Browser</div>
      <h1>数据浏览</h1>
      <p>查看已导入数据集、通道信息和 Marker，并在下方打开波形工作区。</p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>请先新建或打开工程，然后导入 CSV / TXT / JSON 数据。</p>
    </div>

    <div v-else class="browser">
      <aside class="panel list">
        <div class="list-head">
          <strong>文件列表</strong>
          <button class="btn btn-primary" type="button" :disabled="datasetStore.busy" @click="datasetStore.importData()">
            <AppIcon name="download" />
            导入
          </button>
        </div>
        <input
          v-model="datasetStore.search"
          class="search"
          type="search"
          placeholder="搜索名称、通道或格式"
        />
        <button
          v-for="item in datasetStore.filtered"
          :key="item.id"
          class="file"
          :class="{ active: item.id === datasetStore.selectedId }"
          type="button"
          @click="datasetStore.select(item.id)"
        >
          <span class="file-name">
            <AppIcon name="database" :size="14" />
            <span>{{ item.name }}</span>
          </span>
          <small>{{ item.channelCount }} ch · {{ item.sampleCount.toLocaleString() }} · {{ item.metadata.sourceFormat.toUpperCase() }}</small>
        </button>
        <p v-if="datasetStore.datasets.length === 0" class="muted">还没有导入数据。</p>
        <p v-else-if="datasetStore.filtered.length === 0" class="muted">没有匹配的数据集。</p>
      </aside>

      <div class="detail">
        <article v-if="datasetStore.selected" class="panel info">
          <h2>数据集信息</h2>
          <dl>
            <div>
              <dt>名称</dt>
              <dd v-if="renamingId !== datasetStore.selected.id">{{ datasetStore.selected.name }}</dd>
              <dd v-else>
                <input
                  v-model="renameDraft"
                  class="rename-input"
                  @keydown.enter.prevent="commitRename"
                  @keydown.escape.prevent="cancelRename"
                />
              </dd>
            </div>
            <div><dt>采样率</dt><dd>{{ formatNumber(datasetStore.selected.sampleRate, 3) }} Hz</dd></div>
            <div><dt>通道数</dt><dd>{{ datasetStore.selected.channelCount }}</dd></div>
            <div><dt>采样点数</dt><dd>{{ datasetStore.selected.sampleCount.toLocaleString() }}</dd></div>
            <div><dt>时长</dt><dd>{{ formatDuration(datasetStore.selected.duration) }}</dd></div>
            <div><dt>起始时间</dt><dd>{{ formatNumber(datasetStore.selected.startTime, 6) }} s</dd></div>
            <div><dt>来源</dt><dd>{{ datasetStore.selected.metadata.sourceFormat.toUpperCase() }}</dd></div>
            <div><dt>导入时间</dt><dd>{{ formatTimestamp(datasetStore.selected.metadata.importedAt) }}</dd></div>
          </dl>
          <div class="row">
            <template v-if="renamingId === datasetStore.selected.id">
              <button class="btn btn-primary" type="button" :disabled="datasetStore.busy" @click="commitRename">
                <AppIcon name="save" />
                保存名称
              </button>
              <button class="btn" type="button" @click="cancelRename">
                <AppIcon name="x" />
                取消
              </button>
            </template>
            <template v-else>
              <button
                class="btn"
                type="button"
                :disabled="datasetStore.busy"
                @click="startRename(datasetStore.selected.id, datasetStore.selected.name)"
              >
                <AppIcon name="pencil" />
                重命名
              </button>
              <button
                class="btn btn-danger"
                type="button"
                :disabled="datasetStore.busy"
                @click="requestDelete(datasetStore.selected.id)"
              >
                <AppIcon name="trash" />
                删除
              </button>
              <button class="btn" type="button" @click="router.push('/export')">
                <AppIcon name="upload" />
                导出
              </button>
            </template>
          </div>
        </article>

        <article v-if="datasetStore.selected" class="panel info">
          <h2>通道列表</h2>
          <table class="table">
            <thead>
              <tr>
                <th>通道</th>
                <th>颜色</th>
                <th>单位</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="channel in datasetStore.selected.channels" :key="channel.id">
                <td>{{ channel.name }}</td>
                <td><span class="dot" :style="{ background: channel.color }"></span></td>
                <td>{{ channel.unit || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </article>

        <article v-if="datasetStore.selected" class="panel info wide">
          <h2>Marker</h2>
          <table v-if="datasetStore.selected.markers.length" class="table">
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>采样点</th>
                <th>相对时间</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="marker in datasetStore.selected.markers"
                :key="marker.id"
                class="clickable"
                @click="datasetStore.jumpToMarker(datasetStore.selected.id, marker.sampleIndex)"
              >
                <td>
                  <span class="dot" :style="{ background: marker.color }"></span>
                  {{ marker.name }}
                </td>
                <td>{{ MARKER_TYPE_LABELS[marker.type] }}</td>
                <td>{{ marker.sampleIndex }}</td>
                <td>{{ formatNumber(elapsedSeconds(datasetStore.selected.sampleRate, marker.sampleIndex), 6) }} s</td>
                <td>{{ marker.note || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="muted">当前数据集没有 Marker。可在波形工具栏从 Cursor A 添加，或打开 Marker 管理页。</p>
          <div class="row">
            <button class="btn" type="button" @click="router.push('/markers')">
              <AppIcon name="pin" />
              打开 Marker 管理
            </button>
          </div>
        </article>

        <article v-if="datasetStore.statistics.length" class="panel info wide">
          <h2>统计</h2>
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
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in datasetStore.statistics" :key="row.channelId">
                <td>{{ row.channelName }}</td>
                <td>{{ formatNumber(row.min) }}</td>
                <td>{{ formatNumber(row.max) }}</td>
                <td>{{ formatNumber(row.mean) }}</td>
                <td>{{ formatNumber(row.median) }}</td>
                <td>{{ formatNumber(row.rms) }}</td>
                <td>{{ formatNumber(row.stdDev) }}</td>
                <td>{{ formatNumber(row.peakToPeak) }}</td>
              </tr>
            </tbody>
          </table>
        </article>
      </div>
    </div>

    <WaveformViewer
      v-if="datasetStore.selected"
      :dataset="datasetStore.selected"
      :focus-sample-index="datasetStore.focusSampleIndex"
      @add-at="datasetStore.addMarkerAt"
      @focused="datasetStore.clearFocus"
    />

    <ConfirmDialog
      v-if="pendingDelete"
      title="删除数据集"
      :message="`确定删除数据集「${pendingDelete.name}」？工程中的副本文件也会被删除，此操作不可撤销。`"
      confirm-label="删除"
      danger
      @confirm="confirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </section>
</template>

<style scoped>
.data-page {
  overflow: hidden;
}

.browser {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 12px;
  min-height: 220px;
}

.list,
.info {
  padding: 12px;
}

.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.search {
  width: 100%;
  height: 32px;
  margin-bottom: 8px;
  padding: 0 8px;
  border: 1px solid var(--border);
  background: var(--bg-app);
  border-radius: 6px;
}

.file {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  background: var(--bg-panel-alt);
  border-radius: 8px;
}

.file small {
  color: var(--text-muted);
}

.file-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.file-name .app-icon {
  color: var(--accent);
}

.file.active {
  border-color: var(--accent);
}

.detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-width: 0;
}

.wide {
  grid-column: 1 / -1;
}

dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin: 0;
}

dt {
  color: var(--text-muted);
  font-size: 11px;
  text-transform: uppercase;
}

dd {
  margin: 4px 0 0;
}

.rename-input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--accent);
  background: var(--bg-app);
  border-radius: 6px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.clickable {
  cursor: pointer;
}

h2 {
  margin: 0 0 10px;
  font-size: 14px;
}
</style>
