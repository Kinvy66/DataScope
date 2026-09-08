<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { downsampleMinMax } from '@shared/algorithms/downsample'
import { formatNumber } from '../../utils/format'

const props = defineProps<{
  frequencies: number[]
  values: number[]
  color: string
  peakFrequency: number
  yLabel: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hostRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resizeObserver = new ResizeObserver(() => draw())
  if (hostRef.value) resizeObserver.observe(hostRef.value)
  void nextTick(() => draw())
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(
  () => [props.frequencies, props.values, props.color, props.peakFrequency, props.yLabel],
  () => {
    draw()
  }
)

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

  const styles = getComputedStyle(document.documentElement)
  const bg = styles.getPropertyValue('--bg-app').trim() || '#0b0f14'
  const grid = styles.getPropertyValue('--grid').trim() || 'rgba(62,224,197,0.08)'
  const text = styles.getPropertyValue('--text-muted').trim() || '#8b9aab'
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const plotLeft = 56
  const plotRight = 16
  const plotTop = 16
  const plotBottom = 28
  const plotWidth = Math.max(width - plotLeft - plotRight, 1)
  const plotHeight = Math.max(height - plotTop - plotBottom, 1)

  ctx.strokeStyle = grid
  ctx.lineWidth = 1
  for (let i = 0; i <= 8; i += 1) {
    const x = plotLeft + (plotWidth * i) / 8
    ctx.beginPath()
    ctx.moveTo(x, plotTop)
    ctx.lineTo(x, plotTop + plotHeight)
    ctx.stroke()
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = plotTop + (plotHeight * i) / 4
    ctx.beginPath()
    ctx.moveTo(plotLeft, y)
    ctx.lineTo(plotLeft + plotWidth, y)
    ctx.stroke()
  }

  if (props.values.length === 0 || props.frequencies.length === 0) {
    return
  }

  const lastIndex = props.values.length - 1
  const buckets = downsampleMinMax(props.values, 0, lastIndex, Math.floor(plotWidth))
  let maxValue = 0
  for (const bucket of buckets) {
    maxValue = Math.max(maxValue, bucket.max)
  }
  if (maxValue === 0) maxValue = 1

  ctx.beginPath()
  ctx.strokeStyle = props.color
  ctx.lineWidth = 1.4
  buckets.forEach((bucket, index) => {
    const x = plotLeft + (index * plotWidth) / Math.max(buckets.length - 1, 1)
    const y = plotTop + ((maxValue - bucket.max) / maxValue) * plotHeight
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  const fMin = props.frequencies[0]
  const fMax = props.frequencies[lastIndex]
  const span = fMax - fMin || 1
  const peakRatio = (props.peakFrequency - fMin) / span
  if (peakRatio >= 0 && peakRatio <= 1) {
    const peakX = plotLeft + peakRatio * plotWidth
    ctx.strokeStyle = '#ffd166'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(peakX, plotTop)
    ctx.lineTo(peakX, plotTop + plotHeight)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#ffd166'
    ctx.font = '11px Segoe UI'
    ctx.fillText(`Peak ${formatNumber(props.peakFrequency, 3)} Hz`, peakX + 4, plotTop + 12)
  }

  ctx.fillStyle = text
  ctx.font = '11px Segoe UI'
  ctx.fillText(props.yLabel, 8, plotTop + 12)
  ctx.fillText(`${formatNumber(fMin, 2)} Hz`, plotLeft, height - 8)
  ctx.textAlign = 'right'
  ctx.fillText(`${formatNumber(fMax, 2)} Hz`, plotLeft + plotWidth, height - 8)
  ctx.textAlign = 'left'
}
</script>

<template>
  <div ref="hostRef" class="spectrum-plot">
    <canvas ref="canvasRef" />
  </div>
</template>

<style scoped>
.spectrum-plot {
  min-height: 280px;
  height: 100%;
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
