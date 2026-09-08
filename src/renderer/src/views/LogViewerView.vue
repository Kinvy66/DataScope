<script setup lang="ts">
import { onMounted, watch } from 'vue'
import AppIcon from '../components/common/AppIcon.vue'
import { useI18n } from '../i18n'
import { useLogStore } from '../stores/log'
import { formatTimestamp } from '../utils/format'

const logStore = useLogStore()
const { t } = useI18n()

onMounted(() => {
  void logStore.refresh()
})

watch([() => logStore.level, () => logStore.search], () => {
  void logStore.refresh()
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('log.kicker') }}</div>
      <h1>{{ t('log.title') }}</h1>
      <p>{{ t('log.desc') }}</p>
    </header>
    <div class="filters">
      <select v-model="logStore.level">
        <option value="">{{ t('log.allLevels') }}</option>
        <option value="DEBUG">DEBUG</option>
        <option value="INFO">INFO</option>
        <option value="WARNING">WARNING</option>
        <option value="ERROR">ERROR</option>
      </select>
      <input v-model="logStore.search" :placeholder="t('log.search')" />
      <button class="btn" type="button" @click="logStore.refresh()">
        <AppIcon name="refresh" />
        {{ t('common.refresh') }}
      </button>
    </div>
    <div class="panel log-panel">
      <table class="table">
        <thead>
          <tr>
            <th>{{ t('log.time') }}</th>
            <th>{{ t('log.level') }}</th>
            <th>{{ t('log.source') }}</th>
            <th>{{ t('log.message') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in logStore.entries" :key="entry.id">
            <td>{{ formatTimestamp(entry.timestamp) }}</td>
            <td>
              <span class="level" :data-level="entry.level">{{ entry.level }}</span>
            </td>
            <td>{{ entry.source }}</td>
            <td>{{ entry.message }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="logStore.entries.length === 0" class="muted">{{ t('log.empty') }}</p>
    </div>
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 8px;
}

.filters select,
.filters input {
  height: 34px;
  border: 1px solid var(--border);
  background: var(--bg-panel);
  border-radius: 6px;
  padding: 0 10px;
}

.filters input {
  flex: 1;
}

.log-panel {
  padding: 8px 0;
  overflow: auto;
}

.level[data-level='ERROR'] {
  color: var(--danger);
}

.level[data-level='WARNING'] {
  color: var(--warning);
}

.level[data-level='INFO'] {
  color: var(--accent);
}
</style>
