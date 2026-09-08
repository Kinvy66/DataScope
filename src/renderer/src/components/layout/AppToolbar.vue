<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../common/AppIcon.vue'
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
      <button class="btn" type="button" @click="projectStore.openCreateDialog">
        <AppIcon name="folderPlus" />
        新建工程
      </button>
      <button class="btn" type="button" @click="projectStore.openProject()">
        <AppIcon name="folderOpen" />
        打开
      </button>
      <button class="btn" type="button" :disabled="!projectStore.hasProject" @click="projectStore.save()">
        <AppIcon name="save" />
        保存
      </button>
      <button class="btn" type="button" :disabled="!projectStore.hasProject" @click="projectStore.saveAs()">
        <AppIcon name="copy" />
        另存为
      </button>
      <button class="btn" type="button" :disabled="!projectStore.hasProject" @click="projectStore.requestClose()">
        <AppIcon name="close" />
        关闭工程
      </button>
      <button class="btn btn-primary" type="button" :disabled="!projectStore.hasProject" @click="datasetStore.importData()">
        <AppIcon name="download" />
        导入数据
      </button>
    </div>
    <div class="shortcuts">
      <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/live' }" @click="router.push('/live')">
        <AppIcon name="activity" />
        实时
      </button>
      <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/data' }" @click="router.push('/data')">
        <AppIcon name="database" />
        数据浏览
      </button>
      <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/signal' }" @click="router.push('/signal')">
        <AppIcon name="chartLine" />
        信号分析
      </button>
      <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/spectrum' }" @click="router.push('/spectrum')">
        <AppIcon name="chartBar" />
        频谱分析
      </button>
      <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/generator' }" @click="router.push('/generator')">
        <AppIcon name="zap" />
        发生器
      </button>
      <button class="btn btn-ghost" type="button" :class="{ on: route.path === '/markers' }" @click="router.push('/markers')">
        <AppIcon name="pin" />
        Marker
      </button>
      <button class="btn" type="button" @click="toggleTheme">
        <AppIcon :name="appStore.settings.theme === 'dark' ? 'sun' : 'moon'" />
        {{ appStore.settings.theme === 'dark' ? '浅色主题' : '深色主题' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: var(--toolbar-height);
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
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

.actions,
.shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.shortcuts {
  margin-left: auto;
}

.on {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
