<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../common/AppIcon.vue'
import type { IconName } from '../common/icons'
import { useI18n } from '../../i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const items = computed((): { path: string; label: string; hint: string; icon: IconName }[] => [
  { path: '/', label: t('nav.dashboard'), hint: t('nav.hint.dashboard'), icon: 'home' },
  { path: '/data', label: t('nav.data'), hint: t('nav.hint.data'), icon: 'database' },
  { path: '/live', label: t('nav.live'), hint: t('nav.hint.live'), icon: 'activity' },
  { path: '/signal', label: t('nav.signal'), hint: t('nav.hint.signal'), icon: 'chartLine' },
  { path: '/spectrum', label: t('nav.spectrum'), hint: t('nav.hint.spectrum'), icon: 'chartBar' },
  { path: '/markers', label: t('nav.markers'), hint: t('nav.hint.markers'), icon: 'pin' },
  { path: '/generator', label: t('nav.generator'), hint: t('nav.hint.generator'), icon: 'zap' },
  { path: '/export', label: t('nav.export'), hint: t('nav.hint.export'), icon: 'upload' },
  { path: '/tasks', label: t('nav.tasks'), hint: t('nav.hint.tasks'), icon: 'listTodo' },
  { path: '/logs', label: t('nav.logs'), hint: t('nav.hint.logs'), icon: 'fileText' },
  { path: '/project-settings', label: t('nav.projectSettings'), hint: t('nav.hint.project'), icon: 'folder' },
  { path: '/app-settings', label: t('nav.appSettings'), hint: t('nav.hint.app'), icon: 'settings' }
])
</script>

<template>
  <nav class="nav">
    <div class="nav-title">{{ t('nav.title') }}</div>
    <button
      v-for="item in items"
      :key="item.path"
      class="nav-item"
      :class="{ active: route.path === item.path }"
      :data-testid="'nav-' + (item.path === '/' ? 'dashboard' : item.path.slice(1))"
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
