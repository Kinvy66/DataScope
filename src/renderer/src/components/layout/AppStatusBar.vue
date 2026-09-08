<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { useProjectStore } from '../../stores/project'
import { useDatasetStore } from '../../stores/dataset'
import { useLiveStore } from '../../stores/live'
import { useTaskStore } from '../../stores/task'
import { DAQ_STATE_LABELS } from '@shared/types/live'

const router = useRouter()
const appStore = useAppStore()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const liveStore = useLiveStore()
const taskStore = useTaskStore()

const channelCount = computed(() => datasetStore.selected?.channelCount ?? 0)
const sampleCount = computed(() => datasetStore.selected?.sampleCount ?? 0)

const taskLabel = computed(() => {
  if (taskStore.runningCount > 0 && taskStore.pausedCount > 0) {
    return `任务：${taskStore.runningCount} 运行 / ${taskStore.pausedCount} 暂停`
  }
  if (taskStore.runningCount > 0) {
    return `任务：${taskStore.runningCount} 运行中`
  }
  if (taskStore.pausedCount > 0) {
    return `任务：${taskStore.pausedCount} 已暂停`
  }
  if (taskStore.activeCount > 0) {
    return `任务：${taskStore.activeCount} 进行中`
  }
  return '任务：空闲'
})
</script>

<template>
  <footer class="status">
    <span>{{ projectStore.isDirty ? '未保存' : '就绪' }}</span>
    <span class="sep">|</span>
    <span>工程：{{ projectStore.projectName }}</span>
    <span class="sep">|</span>
    <span>{{ channelCount }} ch</span>
    <span class="sep">|</span>
    <span>{{ sampleCount.toLocaleString() }} samples</span>
    <span class="sep">|</span>
    <span>DAQ：{{ DAQ_STATE_LABELS[liveStore.state] }}</span>
    <span class="sep">|</span>
    <button class="task-link" type="button" @click="router.push('/tasks')">{{ taskLabel }}</button>
    <span class="grow"></span>
    <span>{{ appStore.settings.theme === 'dark' ? 'Dark' : 'Light' }}</span>
    <span class="sep">|</span>
    <span>DataScope {{ appStore.info?.version ?? '1.0.0' }}</span>
  </footer>
</template>

<style scoped>
.status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-top: 1px solid var(--border);
  background: var(--bg-panel);
  color: var(--text-muted);
  font-size: 12px;
}

.sep {
  opacity: 0.4;
}

.grow {
  flex: 1;
}

.task-link {
  border: none;
  background: transparent;
  color: inherit;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

.task-link:hover {
  color: var(--text);
}
</style>
