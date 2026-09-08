<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import {
  MARKER_TYPE_COLORS,
  MARKER_TYPE_LABELS,
  elapsedSeconds,
  nextMarkerName
} from '@shared/markers/manage'
import { MARKER_TYPES, type Marker, type MarkerDraft, type MarkerType } from '@shared/types/dataset'
import { useDatasetStore } from '../stores/dataset'
import { useProjectStore } from '../stores/project'
import { formatNumber } from '../utils/format'

const router = useRouter()
const datasetStore = useDatasetStore()
const projectStore = useProjectStore()

const form = reactive({
  name: '',
  type: 'event' as MarkerType,
  sampleIndex: 0,
  elapsed: 0,
  channelId: '',
  color: MARKER_TYPE_COLORS.event,
  note: ''
})

const selectedMarkerId = ref<string | null>(null)
const pendingDeleteId = ref<string | null>(null)
let syncingTime = false

const selectedMarker = computed(
  () => datasetStore.selected?.markers.find((item) => item.id === selectedMarkerId.value) ?? null
)

const pendingDelete = computed(
  () => datasetStore.selected?.markers.find((item) => item.id === pendingDeleteId.value) ?? null
)

watch(
  () => datasetStore.selectedId,
  () => {
    selectedMarkerId.value = null
    pendingDeleteId.value = null
    resetForm()
  },
  { immediate: true }
)

watch(
  () => form.type,
  (type) => {
    if (!selectedMarker.value) {
      form.color = MARKER_TYPE_COLORS[type]
    }
  }
)

function resetForm(): void {
  const dataset = datasetStore.selected
  form.name = dataset ? nextMarkerName(dataset.markers) : 'M1'
  form.type = 'event'
  form.sampleIndex = 0
  form.elapsed = 0
  form.channelId = ''
  form.color = MARKER_TYPE_COLORS.event
  form.note = ''
}

function loadMarker(marker: Marker): void {
  const dataset = datasetStore.selected
  selectedMarkerId.value = marker.id
  form.name = marker.name
  form.type = marker.type
  form.sampleIndex = marker.sampleIndex
  form.elapsed = dataset ? elapsedSeconds(dataset.sampleRate, marker.sampleIndex) : 0
  form.channelId = marker.channelId ?? ''
  form.color = marker.color
  form.note = marker.note
}

function onSampleIndexChange(): void {
  const dataset = datasetStore.selected
  if (!dataset || syncingTime) return
  syncingTime = true
  form.elapsed = elapsedSeconds(dataset.sampleRate, Math.max(0, Math.floor(form.sampleIndex)))
  syncingTime = false
}

function onElapsedChange(): void {
  const dataset = datasetStore.selected
  if (!dataset || syncingTime) return
  syncingTime = true
  form.sampleIndex = Math.round(form.elapsed * dataset.sampleRate)
  syncingTime = false
}

function draft(): MarkerDraft {
  return {
    name: form.name,
    type: form.type,
    sampleIndex: form.sampleIndex,
    channelId: form.channelId || null,
    color: form.color,
    note: form.note
  }
}

async function submitAdd(): Promise<void> {
  await datasetStore.addMarker(draft())
  selectedMarkerId.value = null
  resetForm()
}

async function submitUpdate(): Promise<void> {
  if (!selectedMarkerId.value) return
  await datasetStore.updateMarker(selectedMarkerId.value, draft())
}

function requestDelete(): void {
  if (!selectedMarkerId.value) return
  pendingDeleteId.value = selectedMarkerId.value
}

async function confirmDelete(): Promise<void> {
  const id = pendingDeleteId.value
  pendingDeleteId.value = null
  if (!id) return
  await datasetStore.removeMarker(id)
  if (selectedMarkerId.value === id) {
    selectedMarkerId.value = null
    resetForm()
  }
}

function startCreate(): void {
  selectedMarkerId.value = null
  resetForm()
}

async function jumpToWaveform(): Promise<void> {
  const dataset = datasetStore.selected
  if (!dataset) return
  const index = selectedMarker.value?.sampleIndex ?? form.sampleIndex
  await datasetStore.jumpToMarker(dataset.id, index)
  await router.push('/data')
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">Marker Manager</div>
      <h1>Marker 管理</h1>
      <p>为当前数据集添加、编辑、删除 Marker，并跳转到波形对应位置。保存工程后重新打开仍然保留。</p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>请先新建或打开工程，并导入数据集后再管理 Marker。</p>
    </div>

    <div v-else-if="!datasetStore.selected" class="panel empty-state">
      <p>当前工程还没有数据集。</p>
      <button class="btn btn-primary" type="button" @click="router.push('/data')">
        <AppIcon name="database" />
        前往数据浏览
      </button>
    </div>

    <div v-else class="layout">
      <aside class="panel form">
        <h2>{{ selectedMarker ? `编辑 ${selectedMarker.name}` : '添加 Marker' }}</h2>
        <p class="muted">
          {{ datasetStore.selected.name }} · {{ datasetStore.selected.sampleCount.toLocaleString() }}
          samples · {{ formatNumber(datasetStore.selected.sampleRate, 3) }} Hz
        </p>
        <div class="field">
          <label for="mk-name">名称</label>
          <input id="mk-name" v-model="form.name" />
        </div>
        <div class="field">
          <label for="mk-type">类型</label>
          <select id="mk-type" v-model="form.type">
            <option v-for="item in MARKER_TYPES" :key="item" :value="item">
              {{ MARKER_TYPE_LABELS[item] }}
            </option>
          </select>
        </div>
        <div class="grid">
          <div class="field">
            <label for="mk-index">采样点</label>
            <input
              id="mk-index"
              v-model.number="form.sampleIndex"
              type="number"
              min="0"
              :max="datasetStore.selected.sampleCount - 1"
              step="1"
              @input="onSampleIndexChange"
            />
          </div>
          <div class="field">
            <label for="mk-time">相对时间 (s)</label>
            <input id="mk-time" v-model.number="form.elapsed" type="number" step="any" @input="onElapsedChange" />
          </div>
        </div>
        <div class="field">
          <label for="mk-channel">关联通道（可选）</label>
          <select id="mk-channel" v-model="form.channelId">
            <option value="">全部通道</option>
            <option v-for="channel in datasetStore.selected.channels" :key="channel.id" :value="channel.id">
              {{ channel.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="mk-color">颜色</label>
          <input id="mk-color" v-model="form.color" type="color" />
        </div>
        <div class="field">
          <label for="mk-note">描述</label>
          <textarea id="mk-note" v-model="form.note" />
        </div>
        <div class="row">
          <button class="btn btn-primary" type="button" :disabled="datasetStore.busy" @click="submitAdd">
            <AppIcon name="plus" />
            添加
          </button>
          <button
            class="btn"
            type="button"
            :disabled="datasetStore.busy || !selectedMarker"
            @click="submitUpdate"
          >
            <AppIcon name="save" />
            保存修改
          </button>
          <button
            class="btn btn-danger"
            type="button"
            :disabled="datasetStore.busy || !selectedMarker"
            @click="requestDelete"
          >
            <AppIcon name="trash" />
            删除
          </button>
        </div>
        <div class="row">
          <button class="btn" type="button" @click="jumpToWaveform">
            <AppIcon name="activity" />
            跳转到波形
          </button>
          <button class="btn btn-ghost" type="button" @click="startCreate">
            <AppIcon name="eraser" />
            清空表单
          </button>
        </div>
      </aside>

      <article class="panel list">
        <h2>Marker 列表</h2>
        <table v-if="datasetStore.selected.markers.length" class="table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>采样点</th>
              <th>相对时间</th>
              <th>通道</th>
              <th>描述</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="marker in datasetStore.selected.markers"
              :key="marker.id"
              :class="{ active: marker.id === selectedMarkerId }"
              @click="loadMarker(marker)"
            >
              <td>
                <span class="dot" :style="{ background: marker.color }"></span>
                {{ marker.name }}
              </td>
              <td>{{ MARKER_TYPE_LABELS[marker.type] }}</td>
              <td>{{ marker.sampleIndex }}</td>
              <td>{{ formatNumber(elapsedSeconds(datasetStore.selected.sampleRate, marker.sampleIndex), 6) }} s</td>
              <td>
                {{
                  datasetStore.selected.channels.find((channel) => channel.id === marker.channelId)?.name || '全部'
                }}
              </td>
              <td>{{ marker.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">还没有 Marker。填写左侧表单后点击「添加」，或在波形页用 Cursor A 一键添加。</p>
      </article>
    </div>

    <ConfirmDialog
      v-if="pendingDelete"
      title="删除 Marker"
      :message="`确定删除 Marker「${pendingDelete.name}」？`"
      confirm-label="删除"
      danger
      @confirm="confirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </section>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.form,
.list {
  padding: 16px;
  overflow: auto;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.table tr {
  cursor: pointer;
}

.table tr.active {
  background: var(--accent-soft);
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

h2 {
  margin: 0 0 8px;
  font-size: 16px;
}
</style>
