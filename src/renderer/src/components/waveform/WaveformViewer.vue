<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { CHANNEL_PRESETS } from '@shared/constants'
import AppIcon from '../common/AppIcon.vue'
import type { Channel, DatasetInfo, Marker, ViewportData } from '@shared/types/dataset'
import { elapsedSeconds } from '@shared/markers/manage'
import { useI18n } from '../../i18n'
import { formatNumber } from '../../utils/format'

const props = defineProps<{
  dataset: DatasetInfo
  focusSampleIndex?: number | null
}>()

const emit = defineEmits<{
  'add-at': [sampleIndex: number]
  focused: []
}>()

const { t } = useI18n()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hostRef = ref<HTMLElement | null>(null)
const channelOrder = ref<string[]>([])
const hidden = ref<Set<string>>(new Set())
const maxLanes = ref(8)
const startIndex = ref(0)
const endIndex = ref(0)
const autoScale = ref(true)
const cursorA = ref<number | null>(null)
const cursorB = ref<number | null>(null)
const cursorMode = ref<'a' | 'b' | 'none'>('a')
const traces = ref<ViewportData | null>(null)
const yRange = ref<Record<string, { min: number; max: number }>>({})
const hoverX = ref<number | null>(null)
const dragging = ref(false)
const dragOrigin = ref(0)
const dragStartIndex = ref(0)
const dragEndIndex = ref(0)

const visibleChannels = computed(() => {
  const lookup = new Map(props.dataset.channels.map((channel) => [channel.id, channel]))
  return channelOrder.value
    .map((id) => lookup.get(id))
    .filter((channel): channel is Channel => channel !== undefined && !hidden.value.has(channel.id))
    .slice(0, maxLanes.value)
})

const cursorReadout = computed(() => {
  if (cursorA.value === null) {
    return null
  }
  const timeA = indexToTime(cursorA.value)
  const valuesA = sampleValuesAt(cursorA.value)
  if (cursorB.value === null) {
    return { timeA, timeB: null, deltaTime: null, valuesA, valuesB: null }
  }
  const timeB = indexToTime(cursorB.value)
  return {
    timeA,
    timeB,
    deltaTime: timeB - timeA,
    valuesA,
    valuesB: sampleValuesAt(cursorB.value)
  }
})

let frame = 0
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resetView()
  if (props.focusSampleIndex !== null && props.focusSampleIndex !== undefined) {
    centerOn(props.focusSampleIndex)
    emit('focused')
  }
  resizeObserver = new ResizeObserver(() => {
    void fetchAndDraw()
  })
  if (hostRef.value) resizeObserver.observe(hostRef.value)
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('keydown', onKey)
  cancelAnimationFrame(frame)
})

watch(
  () => props.dataset.id,
  () => {
    resetView()
  }
)

watch(
  () => props.dataset.markers,
  () => {
    draw()
  },
  { deep: true }
)

watch(
  () => props.focusSampleIndex,
  (index) => {
    if (index === null || index === undefined) return
    centerOn(index)
    emit('focused')
  }
)

watch([startIndex, endIndex, visibleChannels, maxLanes], () => {
  void fetchAndDraw()
})

function resetView(): void {
  channelOrder.value = props.dataset.channels.map((channel) => channel.id)
  hidden.value = new Set()
  startIndex.value = 0
  endIndex.value = Math.max(props.dataset.sampleCount - 1, 0)
  cursorA.value = null
  cursorB.value = null
  maxLanes.value = pickLanePreset(props.dataset.channelCount)
  void fetchAndDraw()
}

function pickLanePreset(count: number): number {
  const found = [...CHANNEL_PRESETS].reverse().find((preset) => preset <= Math.max(count, 1))
  return found ?? 1
}

function toggleChannel(id: string): void {
  const next = new Set(hidden.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  hidden.value = next
}

function moveChannel(id: string, direction: -1 | 1): void {
  const index = channelOrder.value.indexOf(id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= channelOrder.value.length) return
  const next = [...channelOrder.value]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  channelOrder.value = next
}

function zoom(factor: number, center = (startIndex.value + endIndex.value) / 2): void {
  const span = Math.max(endIndex.value - startIndex.value, 8)
  const nextSpan = Math.min(props.dataset.sampleCount - 1, Math.max(16, span * factor))
  let nextStart = center - nextSpan / 2
  let nextEnd = center + nextSpan / 2
  if (nextStart < 0) {
    nextEnd -= nextStart
    nextStart = 0
  }
  if (nextEnd > props.dataset.sampleCount - 1) {
    nextStart -= nextEnd - (props.dataset.sampleCount - 1)
    nextEnd = props.dataset.sampleCount - 1
  }
  startIndex.value = Math.max(0, Math.floor(nextStart))
  endIndex.value = Math.max(startIndex.value + 1, Math.ceil(nextEnd))
}

function fitAll(): void {
  startIndex.value = 0
  endIndex.value = Math.max(props.dataset.sampleCount - 1, 0)
  autoScale.value = true
}

function centerOn(index: number): void {
  const clamped = Math.min(Math.max(index, 0), Math.max(props.dataset.sampleCount - 1, 0))
  const span = Math.max(endIndex.value - startIndex.value, 64)
  let nextStart = clamped - span / 2
  let nextEnd = clamped + span / 2
  if (nextStart < 0) {
    nextEnd -= nextStart
    nextStart = 0
  }
  if (nextEnd > props.dataset.sampleCount - 1) {
    nextStart -= nextEnd - (props.dataset.sampleCount - 1)
    nextEnd = props.dataset.sampleCount - 1
  }
  startIndex.value = Math.max(0, Math.floor(nextStart))
  endIndex.value = Math.max(startIndex.value + 1, Math.ceil(nextEnd))
}

function indexToTime(index: number): number {
  return elapsedSeconds(props.dataset.sampleRate, index)
}

function sampleValuesAt(index: number): Array<{ channel: Channel; value: number }> {
  if (!traces.value) return []
  const ratio =
    endIndex.value === startIndex.value
      ? 0
      : (index - startIndex.value) / (endIndex.value - startIndex.value)
  return traces.value.traces.map((trace) => {
    const channel = props.dataset.channels.find((item) => item.id === trace.channelId)
    const bucket = Math.min(trace.mins.length - 1, Math.max(0, Math.round(ratio * (trace.mins.length - 1))))
    const value = (trace.mins[bucket] + trace.maxs[bucket]) / 2
    return {
      channel: channel ?? {
        id: trace.channelId,
        name: trace.channelId,
        unit: '',
        color: '#fff',
        visible: true,
        index: 0
      },
      value
    }
  })
}

async function fetchAndDraw(): Promise<void> {
  await nextTick()
  const canvas = canvasRef.value
  if (!canvas || visibleChannels.value.length === 0) {
    traces.value = null
    draw()
    return
  }
  const width = Math.max(32, canvas.clientWidth - 72)
  const data = await window.datascope.dataset.getViewport({
    datasetId: props.dataset.id,
    channelIds: visibleChannels.value.map((channel) => channel.id),
    startIndex: startIndex.value,
    endIndex: endIndex.value,
    pixelWidth: width
  })
  traces.value = data
  if (autoScale.value) {
    const next: Record<string, { min: number; max: number }> = {}
    for (const trace of data.traces) {
      let min = Infinity
      let max = -Infinity
      for (let i = 0; i < trace.mins.length; i += 1) {
        min = Math.min(min, trace.mins[i])
        max = Math.max(max, trace.maxs[i])
      }
      if (min === max) {
        min -= 1
        max += 1
      }
      const pad = (max - min) * 0.08
      next[trace.channelId] = { min: min - pad, max: max + pad }
    }
    yRange.value = next
  }
  draw()
}

function draw(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const styles = getComputedStyle(document.documentElement)
  const bg = styles.getPropertyValue('--bg-app').trim() || '#0b0f14'
  const grid = styles.getPropertyValue('--grid').trim() || 'rgba(62,224,197,0.08)'
  const text = styles.getPropertyValue('--text-muted').trim() || '#8b9aab'
  const accent = styles.getPropertyValue('--accent').trim() || '#3ee0c5'
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const plotLeft = 56
  const plotRight = 16
  const plotTop = 12
  const plotBottom = 28
  const plotWidth = width - plotLeft - plotRight
  const plotHeight = height - plotTop - plotBottom
  const lanes = Math.max(visibleChannels.value.length, 1)
  const laneHeight = plotHeight / lanes

  ctx.strokeStyle = grid
  ctx.lineWidth = 1
  for (let i = 0; i <= 10; i += 1) {
    const x = plotLeft + (plotWidth * i) / 10
    ctx.beginPath()
    ctx.moveTo(x, plotTop)
    ctx.lineTo(x, plotTop + plotHeight)
    ctx.stroke()
  }

  visibleChannels.value.forEach((channel, lane) => {
    const top = plotTop + lane * laneHeight
    ctx.strokeStyle = grid
    ctx.beginPath()
    ctx.moveTo(plotLeft, top)
    ctx.lineTo(plotLeft + plotWidth, top)
    ctx.stroke()
    ctx.fillStyle = channel.color
    ctx.font = '11px Segoe UI'
    ctx.fillText(channel.name, 8, top + 16)
    const range = yRange.value[channel.id]
    if (range) {
      ctx.fillStyle = text
      ctx.fillText(formatNumber(range.max, 2), 8, top + 28)
      ctx.fillText(formatNumber(range.min, 2), 8, top + laneHeight - 8)
    }
  })

  const data = traces.value
  if (data) {
    data.traces.forEach((trace) => {
      const channel = visibleChannels.value.find((item) => item.id === trace.channelId)
      if (!channel) return
      const lane = visibleChannels.value.findIndex((item) => item.id === channel.id)
      const top = plotTop + lane * laneHeight
      const range = yRange.value[channel.id] ?? { min: -1, max: 1 }
      const span = range.max - range.min || 1
      ctx.strokeStyle = channel.color
      ctx.globalAlpha = 0.95
      ctx.lineWidth = 1.25
      ctx.beginPath()
      for (let i = 0; i < trace.mins.length; i += 1) {
        const x = plotLeft + (i * plotWidth) / Math.max(trace.mins.length - 1, 1)
        const yMax = top + 8 + ((range.max - trace.maxs[i]) / span) * (laneHeight - 16)
        const yMin = top + 8 + ((range.max - trace.mins[i]) / span) * (laneHeight - 16)
        ctx.moveTo(x, yMax)
        ctx.lineTo(x, yMin)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    })
  }

  ctx.fillStyle = text
  ctx.font = '11px Segoe UI'
  ctx.fillText(`${formatNumber(indexToTime(startIndex.value), 6)} s`, plotLeft, height - 8)
  ctx.textAlign = 'right'
  ctx.fillText(`${formatNumber(indexToTime(endIndex.value), 6)} s`, plotLeft + plotWidth, height - 8)
  ctx.textAlign = 'left'

  drawCursor(ctx, cursorA.value, accent, 'A', plotLeft, plotWidth, plotTop, plotHeight)
  drawCursor(ctx, cursorB.value, '#ffd166', 'B', plotLeft, plotWidth, plotTop, plotHeight)
  props.dataset.markers.forEach((marker) => {
    drawMarker(ctx, marker, plotLeft, plotWidth, plotTop, plotHeight)
  })

  if (hoverX.value !== null) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(hoverX.value, plotTop)
    ctx.lineTo(hoverX.value, plotTop + plotHeight)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  marker: Marker,
  plotLeft: number,
  plotWidth: number,
  plotTop: number,
  plotHeight: number
): void {
  const ratio =
    endIndex.value === startIndex.value
      ? 0
      : (marker.sampleIndex - startIndex.value) / (endIndex.value - startIndex.value)
  if (ratio < 0 || ratio > 1) return
  const x = plotLeft + ratio * plotWidth
  ctx.strokeStyle = marker.color
  ctx.setLineDash([3, 4])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, plotTop)
  ctx.lineTo(x, plotTop + plotHeight)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = marker.color
  ctx.fillText(marker.name, x + 4, plotTop + plotHeight - 6)
}

function drawCursor(
  ctx: CanvasRenderingContext2D,
  index: number | null,
  color: string,
  label: string,
  plotLeft: number,
  plotWidth: number,
  plotTop: number,
  plotHeight: number
): void {
  if (index === null) return
  const ratio =
    endIndex.value === startIndex.value ? 0 : (index - startIndex.value) / (endIndex.value - startIndex.value)
  if (ratio < 0 || ratio > 1) return
  const x = plotLeft + ratio * plotWidth
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, plotTop)
  ctx.lineTo(x, plotTop + plotHeight)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.fillText(label, x + 4, plotTop + 12)
}

function eventToIndex(event: PointerEvent): number {
  const canvas = canvasRef.value
  if (!canvas) return startIndex.value
  const rect = canvas.getBoundingClientRect()
  const plotLeft = 56
  const plotWidth = canvas.clientWidth - 72
  const x = Math.min(Math.max(event.clientX - rect.left - plotLeft, 0), plotWidth)
  const ratio = plotWidth === 0 ? 0 : x / plotWidth
  return Math.round(startIndex.value + ratio * (endIndex.value - startIndex.value))
}

function onWheel(event: WheelEvent): void {
  event.preventDefault()
  const center = eventToIndex(event as unknown as PointerEvent)
  zoom(event.deltaY > 0 ? 1.25 : 0.8, center)
}

function onPointerDown(event: PointerEvent): void {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.setPointerCapture(event.pointerId)
  if (event.shiftKey || event.button === 1) {
    dragging.value = true
    dragOrigin.value = event.clientX
    dragStartIndex.value = startIndex.value
    dragEndIndex.value = endIndex.value
    return
  }
  const index = eventToIndex(event)
  if (cursorMode.value === 'a' || cursorA.value === null) {
    cursorA.value = index
    cursorMode.value = 'b'
  } else {
    cursorB.value = index
    cursorMode.value = 'a'
  }
  draw()
}

function onPointerMove(event: PointerEvent): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  hoverX.value = event.clientX - rect.left
  if (dragging.value) {
    const plotWidth = canvas.clientWidth - 72
    const span = dragEndIndex.value - dragStartIndex.value
    const deltaSamples = ((dragOrigin.value - event.clientX) / plotWidth) * span
    let nextStart = dragStartIndex.value + deltaSamples
    let nextEnd = dragEndIndex.value + deltaSamples
    if (nextStart < 0) {
      nextEnd -= nextStart
      nextStart = 0
    }
    if (nextEnd > props.dataset.sampleCount - 1) {
      nextStart -= nextEnd - (props.dataset.sampleCount - 1)
      nextEnd = props.dataset.sampleCount - 1
    }
    startIndex.value = Math.max(0, Math.floor(nextStart))
    endIndex.value = Math.max(startIndex.value + 1, Math.ceil(nextEnd))
  } else {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => draw())
  }
}

function onPointerUp(event: PointerEvent): void {
  const canvas = canvasRef.value
  canvas?.releasePointerCapture(event.pointerId)
  dragging.value = false
}

function onKey(event: KeyboardEvent): void {
  if (event.key === 'a' || event.key === 'A') cursorMode.value = 'a'
  if (event.key === 'b' || event.key === 'B') cursorMode.value = 'b'
  if (event.key === 'f') fitAll()
  if (event.key === '+' || event.key === '=') zoom(0.8)
  if (event.key === '-') zoom(1.25)
}

function clearCursors(): void {
  cursorA.value = null
  cursorB.value = null
  cursorMode.value = 'a'
  draw()
}

function addMarkerAtCursor(): void {
  const index = cursorA.value ?? Math.round((startIndex.value + endIndex.value) / 2)
  emit('add-at', index)
}
</script>

<template>
  <section class="waveform">
    <div class="wave-toolbar">
      <button class="btn" type="button" @click="zoom(0.8)">
        <AppIcon name="zoomIn" />
        {{ t('wave.zoomIn') }}
      </button>
      <button class="btn" type="button" @click="zoom(1.25)">
        <AppIcon name="zoomOut" />
        {{ t('wave.zoomOut') }}
      </button>
      <button class="btn" type="button" @click="fitAll">
        <AppIcon name="maximize" />
        Fit All
      </button>
      <button class="btn" type="button" @click="autoScale = true">
        <AppIcon name="unfold" />
        Auto Scale
      </button>
      <label class="lanes">
        {{ t('wave.lanes') }}
        <select v-model.number="maxLanes">
          <option v-for="preset in CHANNEL_PRESETS" :key="preset" :value="preset">{{ preset }}</option>
        </select>
      </label>
      <button class="btn" type="button" :class="{ on: cursorMode === 'a' }" @click="cursorMode = 'a'">
        <AppIcon name="crosshair" />
        Cursor A
      </button>
      <button class="btn" type="button" :class="{ on: cursorMode === 'b' }" @click="cursorMode = 'b'">
        <AppIcon name="crosshair" />
        Cursor B
      </button>
      <button class="btn btn-ghost" type="button" @click="clearCursors">
        <AppIcon name="x" />
        {{ t('wave.clearCursors') }}
      </button>
      <button class="btn btn-primary" type="button" @click="addMarkerAtCursor">
        <AppIcon name="plus" />
        {{ t('wave.addMarker') }}
      </button>
    </div>
    <div class="wave-body">
      <aside class="channels">
        <div
          v-for="channel in dataset.channels"
          :key="channel.id"
          class="channel"
          :class="{ dim: hidden.has(channel.id) }"
        >
          <button class="swatch" type="button" :style="{ background: channel.color }" @click="toggleChannel(channel.id)" />
          <span>{{ channel.name }}</span>
          <button class="tiny" type="button" :title="t('wave.moveUp')" @click="moveChannel(channel.id, -1)">
            <AppIcon name="arrowUp" :size="12" />
          </button>
          <button class="tiny" type="button" :title="t('wave.moveDown')" @click="moveChannel(channel.id, 1)">
            <AppIcon name="arrowDown" :size="12" />
          </button>
        </div>
      </aside>
      <div ref="hostRef" class="canvas-wrap" data-testid="waveform-canvas">
        <canvas
          ref="canvasRef"
          @wheel.prevent="onWheel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
        />
      </div>
      <aside class="readout">
        <div class="kicker">Cursors</div>
        <p>Time A：{{ cursorReadout ? formatNumber(cursorReadout.timeA, 6) : '—' }} s</p>
        <p>Time B：{{ cursorReadout?.timeB != null ? formatNumber(cursorReadout.timeB, 6) : '—' }} s</p>
        <p>Δt：{{ cursorReadout?.deltaTime != null ? formatNumber(cursorReadout.deltaTime, 6) : '—' }} s</p>
        <div v-if="cursorReadout" class="values">
          <div v-for="item in cursorReadout.valuesA" :key="item.channel.id">
            <strong :style="{ color: item.channel.color }">{{ item.channel.name }}</strong>
            <div>A {{ formatNumber(item.value) }}</div>
            <div v-if="cursorReadout.valuesB">
              B
              {{
                formatNumber(
                  cursorReadout.valuesB.find((entry) => entry.channel.id === item.channel.id)?.value ?? 0
                )
              }}
            </div>
            <div v-if="cursorReadout.valuesB" class="muted">
              Δ
              {{
                formatNumber(
                  (cursorReadout.valuesB.find((entry) => entry.channel.id === item.channel.id)?.value ?? 0) -
                    item.value
                )
              }}
            </div>
          </div>
        </div>
        <p class="hint">{{ t('wave.hint') }}</p>
        <div class="kicker">Markers</div>
        <button
          v-for="marker in dataset.markers"
          :key="marker.id"
          class="marker-jump"
          type="button"
          @click="centerOn(marker.sampleIndex)"
        >
          <span class="dot" :style="{ background: marker.color }"></span>
          {{ marker.name }} · {{ marker.sampleIndex }}
        </button>
        <p v-if="dataset.markers.length === 0" class="hint">{{ t('wave.noMarkers') }}</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.waveform {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  gap: 8px;
}

.wave-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.lanes {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.lanes select {
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-panel-alt);
  padding: 0 8px;
}

.wave-body {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 168px 1fr 210px;
  gap: 8px;
}

.channels,
.readout {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  overflow: auto;
}

.channel {
  display: grid;
  grid-template-columns: 12px 1fr auto auto;
  gap: 6px;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.channel.dim {
  opacity: 0.4;
}

.swatch {
  width: 12px;
  height: 12px;
  border: none;
  border-radius: 3px;
  padding: 0;
}

.tiny {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--border);
  background: var(--bg-panel-alt);
  border-radius: 4px;
}

.canvas-wrap {
  min-width: 0;
  min-height: 360px;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.readout p,
.readout div {
  font-size: 12px;
  margin: 6px 0;
}

.values {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.hint {
  color: var(--text-subtle);
}

.on {
  border-color: var(--accent);
  color: var(--accent);
}

.marker-jump {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
  padding: 4px 6px;
  border: 1px solid var(--border);
  background: var(--bg-panel-alt);
  border-radius: 6px;
  color: var(--text);
  font-size: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
</style>
