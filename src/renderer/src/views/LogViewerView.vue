<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useLogStore } from '../stores/log'
import { formatTimestamp } from '../utils/format'

const logStore = useLogStore()

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
      <div class="kicker">Logs</div>
      <h1>日志查看</h1>
      <p>查看主进程与渲染进程记录的 DEBUG / INFO / WARNING / ERROR 日志。</p>
    </header>
    <div class="filters">
      <select v-model="logStore.level">
        <option value="">全部级别</option>
        <option value="DEBUG">DEBUG</option>
        <option value="INFO">INFO</option>
        <option value="WARNING">WARNING</option>
        <option value="ERROR">ERROR</option>
      </select>
      <input v-model="logStore.search" placeholder="搜索日志" />
      <button class="btn" type="button" @click="logStore.refresh()">刷新</button>
    </div>
    <div class="panel log-panel">
      <table class="table">
        <thead>
          <tr>
            <th>时间</th>
            <th>级别</th>
            <th>来源</th>
            <th>消息</th>
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
      <p v-if="logStore.entries.length === 0" class="muted">暂无日志。</p>
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
