<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { LiveChannelInfo } from '@shared/types/live'
import type { ViewportData } from '@shared/types/dataset'
import { formatNumber } from '../../utils/format'

const props = defineProps<{
  channels: LiveChannelInfo[]
  running: boolean
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hostRef = ref<HTMLElement | null>(null)
const traces = ref<ViewportData | null>(null)

let poll: ReturnType<typeof setInterval> | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    void fetchAndDraw()
  })
  if (hostRef.value) resizeObserver.observe(hostRef.value)
  startPoll()
  void fetchAndDraw()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  stopPoll()
})

watch(
  () => props.running,
  () => {
    startPoll()
    void fetchAndDraw()
  }
)

watch(
  () => props.channels.map((channel) => channel.id).join(','),
  () => {
    void fetchAndDraw()
  }
)

function startPoll(): void {
  stopPoll()
  if (!props.running) return
  poll = setInterval(() => {
    void fetchAndDraw()
  }, 50)
}

function stopPoll(): void {
  if (poll) {
    clearInterval(poll)
    poll = null
  }
}

async function fetchAndDraw(): Promise<void> {
  await nextTick()
  const canvas = canvasRef.value
  if (!canvas) return
  const width = Math.max(32, canvas.clientWidth - 72)
  traces.value = await window.datascope.live.getViewport({ pixelWidth: width })
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
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const plotLeft = 56
  const plotRight = 16
  const plotTop = 12
  const plotBottom = 28
  const plotWidth = width - plotLeft - plotRight
  const plotHeight = height - plotTop - plotBottom
  const lanes = Math.max(props.channels.length, 1)
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

  const data = traces.value
  props.channels.forEach((channel, lane) => {
    const top = plotTop + lane * laneHeight
    ctx.strokeStyle = grid
    ctx.beginPath()
    ctx.moveTo(plotLeft, top)
    ctx.lineTo(plotLeft + plotWidth, top)
    ctx.stroke()
    ctx.fillStyle = channel.color
    ctx.font = '11px Segoe UI'
    ctx.fillText(channel.name, 8, top + 16)

    const trace = data?.traces.find((item) => item.channelId === channel.id)
    if (!trace || trace.mins.length === 0) return
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
    const span = max - min || 1
    ctx.fillStyle = text
    ctx.fillText(formatNumber(max, 2), 8, top + 28)
    ctx.fillText(formatNumber(min, 2), 8, top + laneHeight - 8)
    ctx.strokeStyle = channel.color
    ctx.lineWidth = 1.25
    ctx.beginPath()
    for (let i = 0; i < trace.mins.length; i += 1) {
      const x = plotLeft + (i * plotWidth) / Math.max(trace.mins.length - 1, 1)
      const yMax = top + 8 + ((max - trace.maxs[i]) / span) * (laneHeight - 16)
      const yMin = top + 8 + ((max - trace.mins[i]) / span) * (laneHeight - 16)
      ctx.moveTo(x, yMax)
      ctx.lineTo(x, yMin)
    }
    ctx.stroke()
  })
}
</script>

<template>
  <div ref="hostRef" class="live-plot">
    <canvas ref="canvasRef" />
  </div>
</template>

<style scoped>
.live-plot {
  min-width: 0;
  min-height: 280px;
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
