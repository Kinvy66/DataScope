<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppIcon from '../common/AppIcon.vue'
import AppToolbar from './AppToolbar.vue'
import AppNavigation from './AppNavigation.vue'
import AppStatusBar from './AppStatusBar.vue'
import NewProjectDialog from '../project/NewProjectDialog.vue'
import UnsavedDialog from '../project/UnsavedDialog.vue'
import { useAppStore } from '../../stores/app'
import { useProjectStore } from '../../stores/project'

const appStore = useAppStore()
const projectStore = useProjectStore()
</script>

<template>
  <div class="shell">
    <AppToolbar />
    <div class="shell-body">
      <AppNavigation />
      <main class="workspace">
        <div v-if="appStore.globalError" class="error-banner">
          <span>{{ appStore.globalError }}</span>
          <button class="btn btn-ghost" type="button" @click="appStore.setGlobalError(null)">
            <AppIcon name="x" />
            关闭
          </button>
        </div>
        <RouterView />
      </main>
    </div>
    <AppStatusBar />
    <NewProjectDialog v-if="projectStore.createDialogOpen" />
    <UnsavedDialog
      v-if="projectStore.closeDialogOpen"
      title="工程有未保存的修改"
      @save="projectStore.confirmUnsaved('save')"
      @discard="projectStore.confirmUnsaved('discard')"
      @cancel="projectStore.confirmUnsaved('cancel')"
    />
    <UnsavedDialog
      v-if="appStore.closeDialogOpen"
      title="关闭窗口前保存工程？"
      @save="appStore.confirmClose('save')"
      @discard="appStore.confirmClose('discard')"
      @cancel="appStore.confirmClose('cancel')"
    />
  </div>
</template>

<style scoped>
.shell {
  height: 100%;
  display: grid;
  grid-template-rows: var(--toolbar-height) 1fr var(--statusbar-height);
  background: var(--bg-app);
}

.shell-body {
  display: grid;
  grid-template-columns: var(--nav-width) 1fr;
  min-height: 0;
}

.workspace {
  min-width: 0;
  min-height: 0;
  background:
    radial-gradient(circle at top left, var(--accent-soft), transparent 28%),
    var(--bg-shell);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 12px 16px 0;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--danger) 40%, var(--border));
  background: color-mix(in srgb, var(--danger) 12%, var(--bg-panel));
  color: var(--danger);
  border-radius: 8px;
  font-size: 13px;
}
</style>
