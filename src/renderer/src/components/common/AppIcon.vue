<script setup lang="ts">
import { computed } from 'vue'
import { iconGraphics, type IconName, type IconNode } from './icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
  }>(),
  { size: 16 }
)

function nodesOf<T extends IconNode['t']>(type: T): Extract<IconNode, { t: T }>[] {
  return iconGraphics[props.name].filter((node): node is Extract<IconNode, { t: T }> => node.t === type)
}

const paths = computed(() => nodesOf('path'))
const circles = computed(() => nodesOf('circle'))
const ellipses = computed(() => nodesOf('ellipse'))
const lines = computed(() => nodesOf('line'))
const polylines = computed(() => nodesOf('polyline'))
const polygons = computed(() => nodesOf('polygon'))
const rects = computed(() => nodesOf('rect'))
</script>

<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(node, index) in paths" :key="`path-${index}`" :d="node.d" />
    <circle
      v-for="(node, index) in circles"
      :key="`circle-${index}`"
      :cx="node.cx"
      :cy="node.cy"
      :r="node.r"
    />
    <ellipse
      v-for="(node, index) in ellipses"
      :key="`ellipse-${index}`"
      :cx="node.cx"
      :cy="node.cy"
      :rx="node.rx"
      :ry="node.ry"
    />
    <line
      v-for="(node, index) in lines"
      :key="`line-${index}`"
      :x1="node.x1"
      :y1="node.y1"
      :x2="node.x2"
      :y2="node.y2"
    />
    <polyline v-for="(node, index) in polylines" :key="`polyline-${index}`" :points="node.points" />
    <polygon v-for="(node, index) in polygons" :key="`polygon-${index}`" :points="node.points" />
    <rect
      v-for="(node, index) in rects"
      :key="`rect-${index}`"
      :x="node.x"
      :y="node.y"
      :width="node.w"
      :height="node.h"
      :rx="node.rx ?? 0"
    />
  </svg>
</template>
