<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DAQ_STATE_MESSAGE_KEYS } from '@shared/i18n'
import { useI18n } from '../../i18n'
import { useAppStore } from '../../stores/app'
import { useProjectStore } from '../../stores/project'
import { useDatasetStore } from '../../stores/dataset'
import { useLiveStore } from '../../stores/live'
import { useTaskStore } from '../../stores/task'

const router = useRouter()
const appStore = useAppStore()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const liveStore = useLiveStore()
const taskStore = useTaskStore()
const { t } = useI18n()

const channelCount = computed(() => datasetStore.selected?.channelCount ?? 0)
const sampleCount = computed(() => datasetStore.selected?.sampleCount ?? 0)

const taskLabel = computed(() => {
  if (taskStore.runningCount > 0 && taskStore.pausedCount > 0) {
    return t('status.taskMixed', { running: taskStore.runningCount, paused: taskStore.pausedCount })
  }
  if (taskStore.runningCount > 0) {
    return t('status.taskRunning', { count: taskStore.runningCount })
  }
  if (taskStore.pausedCount > 0) {
    return t('status.taskPaused', { count: taskStore.pausedCount })
  }
  if (taskStore.activeCount > 0) {
    return t('status.taskActive', { count: taskStore.activeCount })
  }
  return t('status.taskIdle')
})
</script>

<template>
  <footer class="status">
    <span data-testid="status-dirty">{{ projectStore.isDirty ? t('status.unsaved') : t('status.ready') }}</span>
    <span class="sep">|</span>
    <span data-testid="status-project">{{ t('status.project', { name: projectStore.projectName }) }}</span>
    <span class="sep">|</span>
    <span data-testid="status-channels">{{ channelCount }} ch</span>
    <span class="sep">|</span>
    <span data-testid="status-samples">{{ sampleCount.toLocaleString() }} samples</span>
    <span class="sep">|</span>
    <span>{{ t('status.daq', { state: t(DAQ_STATE_MESSAGE_KEYS[liveStore.state]) }) }}</span>
    <span class="sep">|</span>
    <button class="task-link" type="button" @click="router.push('/tasks')">{{ taskLabel }}</button>
    <span class="grow"></span>
    <span>{{ appStore.settings.theme === 'dark' ? t('status.themeDark') : t('status.themeLight') }}</span>
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
