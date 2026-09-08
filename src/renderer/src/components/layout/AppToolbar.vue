<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { useProjectStore } from '../../stores/project'
import { useDatasetStore } from '../../stores/dataset'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const appIcon = `${import.meta.env.BASE_URL}icon.png`

function toggleTheme(): void {
  void appStore.setTheme(appStore.settings.theme === 'dark' ? 'light' : 'dark')
}
</script>

<template>
  <header class="toolbar">
    <div class="brand">
      <img class="logo" :src="appIcon" width="22" height="22" alt="" />
      <strong>DataScope</strong>
      <span class="ver">V1.0</span>
    </div>
    <div class="actions">
      <button class="btn" type="button" @click="projectStore.openCreateDialog">新建工程</button>
      <button class="btn" type="button" @click="projectStore.openProject()">打开</button>
      <button class="btn" type="button" :disabled="!projectStore.hasProject" @click="projectStore.save()">保存</button>
      <button class="btn" type="button" :disabled="!projectStore.hasProject" @click="projectStore.saveAs()">另存为</button>
      <button class="btn" type="button" :disabled="!projectStore.hasProject" @click="projectStore.requestClose()">关闭工程</button>
      <button class="btn btn-primary" type="button" :disabled="!projectStore.hasProject" @click="datasetStore.importData()">
        导入数据
      </button>
    </div>
    <div class="spacer"></div>
    <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/data' }" @click="router.push('/data')">
      数据浏览
    </button>
    <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/signal' }" @click="router.push('/signal')">
      信号分析
    </button>
    <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/spectrum' }" @click="router.push('/spectrum')">
      频谱分析
    </button>
    <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/generator' }" @click="router.push('/generator')">
      发生器
    </button>
    <button class="btn" type="button" @click="toggleTheme">
      {{ appStore.settings.theme === 'dark' ? '浅色主题' : '深色主题' }}
    </button>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
}

.logo {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: block;
}

.ver {
  font-size: 11px;
  color: var(--text-subtle);
}

.actions {
  display: flex;
  gap: 6px;
}

.spacer {
  flex: 1;
}

.on {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
