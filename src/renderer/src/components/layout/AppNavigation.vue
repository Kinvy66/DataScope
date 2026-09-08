<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../common/AppIcon.vue'
import type { IconName } from '../common/icons'

const route = useRoute()
const router = useRouter()

const items: { path: string; label: string; hint: string; icon: IconName }[] = [
  { path: '/', label: '工作台', hint: 'Dashboard', icon: 'home' },
  { path: '/data', label: '数据浏览', hint: 'Data Browser', icon: 'database' },
  { path: '/live', label: '实时监视', hint: 'Live Monitor', icon: 'activity' },
  { path: '/signal', label: '信号分析', hint: 'Signal Analysis', icon: 'chartLine' },
  { path: '/spectrum', label: '频谱分析', hint: 'Spectrum', icon: 'chartBar' },
  { path: '/markers', label: 'Marker 管理', hint: 'Markers', icon: 'pin' },
  { path: '/generator', label: '数据发生器', hint: 'Generator', icon: 'zap' },
  { path: '/export', label: '数据导出', hint: 'Export', icon: 'upload' },
  { path: '/tasks', label: '任务管理', hint: 'Tasks', icon: 'listTodo' },
  { path: '/logs', label: '日志查看', hint: 'Logs', icon: 'fileText' },
  { path: '/project-settings', label: '工程设置', hint: 'Project', icon: 'folder' },
  { path: '/app-settings', label: '应用设置', hint: 'Application', icon: 'settings' }
]
</script>

<template>
  <nav class="nav">
    <div class="nav-title">导航</div>
    <button
      v-for="item in items"
      :key="item.path"
      class="nav-item"
      :class="{ active: route.path === item.path }"
      type="button"
      @click="router.push(item.path)"
    >
      <AppIcon class="nav-icon" :name="item.icon" />
      <span class="nav-text">
        <span>{{ item.label }}</span>
        <small>{{ item.hint }}</small>
      </span>
    </button>
  </nav>
</template>

<style scoped>
.nav {
  border-right: 1px solid var(--border);
  background: var(--bg-panel);
  overflow: auto;
  padding: 12px 8px;
}

.nav-title {
  padding: 4px 10px 10px;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.nav-item {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin-bottom: 2px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 8px;
  text-align: left;
}

.nav-icon {
  flex-shrink: 0;
  color: var(--accent);
}

.nav-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}

.nav-item small {
  color: var(--text-subtle);
  font-size: 11px;
}

.nav-item:hover {
  background: var(--bg-hover);
}

.nav-item.active {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  color: var(--text);
}
</style>
