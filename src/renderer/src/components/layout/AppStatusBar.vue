<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { useProjectStore } from '../../stores/project'
import { useDatasetStore } from '../../stores/dataset'
import { useLiveStore } from '../../stores/live'
import { DAQ_STATE_LABELS } from '@shared/types/live'

const appStore = useAppStore()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const liveStore = useLiveStore()

const channelCount = computed(() => datasetStore.selected?.channelCount ?? 0)
const sampleCount = computed(() => datasetStore.selected?.sampleCount ?? 0)
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
</style>
