<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import { MARKER_TYPE_COLORS, elapsedSeconds, nextMarkerName } from '@shared/markers/manage'
import { MARKER_TYPE_MESSAGE_KEYS } from '@shared/i18n'
import { MARKER_TYPES, type Marker, type MarkerDraft, type MarkerType } from '@shared/types/dataset'
import { useI18n } from '../i18n'
import { useDatasetStore } from '../stores/dataset'
import { useProjectStore } from '../stores/project'
import { formatNumber } from '../utils/format'

const router = useRouter()
const datasetStore = useDatasetStore()
const projectStore = useProjectStore()
const { t } = useI18n()

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
      <div class="kicker">{{ t('marker.kicker') }}</div>
      <h1>{{ t('marker.title') }}</h1>
      <p>{{ t('marker.desc') }}</p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>{{ t('marker.needProject') }}</p>
    </div>

    <div v-else-if="!datasetStore.selected" class="panel empty-state">
      <p>{{ t('marker.noDataset') }}</p>
      <button class="btn btn-primary" type="button" @click="router.push('/data')">
        <AppIcon name="database" />
        {{ t('common.goData') }}
      </button>
    </div>

    <div v-else class="layout">
      <aside class="panel form">
        <h2>{{ selectedMarker ? t('marker.edit', { name: selectedMarker.name }) : t('marker.addTitle') }}</h2>
        <p class="muted">
          {{ datasetStore.selected.name }} · {{ datasetStore.selected.sampleCount.toLocaleString() }}
          samples · {{ formatNumber(datasetStore.selected.sampleRate, 3) }} Hz
        </p>
        <div class="field">
          <label for="mk-name">{{ t('common.name') }}</label>
          <input id="mk-name" v-model="form.name" />
        </div>
        <div class="field">
          <label for="mk-type">{{ t('common.type') }}</label>
          <select id="mk-type" v-model="form.type">
            <option v-for="item in MARKER_TYPES" :key="item" :value="item">
              {{ t(MARKER_TYPE_MESSAGE_KEYS[item]) }}
            </option>
          </select>
        </div>
        <div class="grid">
          <div class="field">
            <label for="mk-index">{{ t('common.sampleIndex') }}</label>
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
            <label for="mk-time">{{ t('marker.elapsed') }}</label>
            <input id="mk-time" v-model.number="form.elapsed" type="number" step="any" @input="onElapsedChange" />
          </div>
        </div>
        <div class="field">
          <label for="mk-channel">{{ t('marker.channelOptional') }}</label>
          <select id="mk-channel" v-model="form.channelId">
            <option value="">{{ t('marker.allChannels') }}</option>
            <option v-for="channel in datasetStore.selected.channels" :key="channel.id" :value="channel.id">
              {{ channel.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="mk-color">{{ t('common.color') }}</label>
          <input id="mk-color" v-model="form.color" type="color" />
        </div>
        <div class="field">
          <label for="mk-note">{{ t('common.description') }}</label>
          <textarea id="mk-note" v-model="form.note" />
        </div>
        <div class="row">
          <button class="btn btn-primary" type="button" :disabled="datasetStore.busy" @click="submitAdd">
            <AppIcon name="plus" />
            {{ t('marker.add') }}
          </button>
          <button
            class="btn"
            type="button"
            :disabled="datasetStore.busy || !selectedMarker"
            @click="submitUpdate"
          >
            <AppIcon name="save" />
            {{ t('marker.save') }}
          </button>
          <button
            class="btn btn-danger"
            type="button"
            :disabled="datasetStore.busy || !selectedMarker"
            @click="requestDelete"
          >
            <AppIcon name="trash" />
            {{ t('common.delete') }}
          </button>
        </div>
        <div class="row">
          <button class="btn" type="button" @click="jumpToWaveform">
            <AppIcon name="activity" />
            {{ t('marker.jump') }}
          </button>
          <button class="btn btn-ghost" type="button" @click="startCreate">
            <AppIcon name="eraser" />
            {{ t('marker.clearForm') }}
          </button>
        </div>
      </aside>

      <article class="panel list">
        <h2>{{ t('marker.list') }}</h2>
        <table v-if="datasetStore.selected.markers.length" class="table">
          <thead>
            <tr>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('common.type') }}</th>
              <th>{{ t('common.sampleIndex') }}</th>
              <th>{{ t('common.relativeTime') }}</th>
              <th>{{ t('common.channel') }}</th>
              <th>{{ t('common.description') }}</th>
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
              <td>{{ t(MARKER_TYPE_MESSAGE_KEYS[marker.type]) }}</td>
              <td>{{ marker.sampleIndex }}</td>
              <td>{{ formatNumber(elapsedSeconds(datasetStore.selected.sampleRate, marker.sampleIndex), 6) }} s</td>
              <td>
                {{
                  datasetStore.selected.channels.find((channel) => channel.id === marker.channelId)?.name ||
                    t('marker.allChannels')
                }}
              </td>
              <td>{{ marker.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">{{ t('marker.empty') }}</p>
      </article>
    </div>

    <ConfirmDialog
      v-if="pendingDelete"
      :title="t('marker.deleteTitle')"
      :message="t('marker.deleteMessage', { name: pendingDelete.name })"
      :confirm-label="t('common.delete')"
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
