<script setup lang="ts">
import AppIcon from '../common/AppIcon.vue'
import { useI18n } from '../../i18n'
import { useAppStore } from '../../stores/app'
import { useProjectStore } from '../../stores/project'
import { useDatasetStore } from '../../stores/dataset'

const appStore = useAppStore()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const { t } = useI18n()
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
      <button class="btn" type="button" data-testid="toolbar-new-project" @click="projectStore.openCreateDialog">
        <AppIcon name="folderPlus" />
        {{ t('toolbar.newProject') }}
      </button>
      <button class="btn" type="button" data-testid="toolbar-open" @click="projectStore.openProject()">
        <AppIcon name="folderOpen" />
        {{ t('toolbar.open') }}
      </button>
      <button class="btn" type="button" data-testid="toolbar-save" :disabled="!projectStore.hasProject" @click="projectStore.save()">
        <AppIcon name="save" />
        {{ t('toolbar.save') }}
      </button>
      <button class="btn" type="button" data-testid="toolbar-save-as" :disabled="!projectStore.hasProject" @click="projectStore.saveAs()">
        <AppIcon name="copy" />
        {{ t('toolbar.saveAs') }}
      </button>
      <button class="btn" type="button" data-testid="toolbar-close" :disabled="!projectStore.hasProject" @click="projectStore.requestClose()">
        <AppIcon name="close" />
        {{ t('toolbar.closeProject') }}
      </button>
      <button
        class="btn btn-primary"
        type="button"
        data-testid="toolbar-import"
        :disabled="!projectStore.hasProject"
        @click="datasetStore.importData()"
      >
        <AppIcon name="download" />
        {{ t('toolbar.import') }}
      </button>
    </div>
    <button class="btn theme" type="button" @click="toggleTheme">
      <AppIcon :name="appStore.settings.theme === 'dark' ? 'sun' : 'moon'" />
      {{ appStore.settings.theme === 'dark' ? t('toolbar.lightTheme') : t('toolbar.darkTheme') }}
    </button>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  height: var(--toolbar-height);
  padding: 0 12px;
  overflow: hidden;
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

.actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.actions .btn {
  flex-shrink: 0;
}

.theme {
  margin-left: auto;
  flex-shrink: 0;
}
</style>
