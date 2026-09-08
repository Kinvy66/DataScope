<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import { useI18n } from '../i18n'
import { useProjectStore } from '../stores/project'
import { useDatasetStore } from '../stores/dataset'
import { formatPath, formatTimestamp } from '../utils/format'

const router = useRouter()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
const { t } = useI18n()
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('dashboard.kicker') }}</div>
      <h1>{{ t('dashboard.title') }}</h1>
      <p>{{ t('dashboard.desc') }}</p>
    </header>

    <div class="grid">
      <article class="panel card">
        <h2>{{ projectStore.hasProject ? projectStore.projectName : t('dashboard.noProject') }}</h2>
        <p v-if="projectStore.current" class="muted">
          {{ projectStore.current.rootPath }}
        </p>
        <p v-else class="muted">{{ t('dashboard.emptyHint') }}</p>
        <div class="row">
          <button class="btn btn-primary" type="button" @click="projectStore.openCreateDialog">
            <AppIcon name="folderPlus" />
            {{ t('toolbar.newProject') }}
          </button>
          <button class="btn" type="button" @click="projectStore.openProject()">
            <AppIcon name="folderOpen" />
            {{ t('dashboard.openProject') }}
          </button>
        </div>
      </article>

      <article class="panel card">
        <h2>{{ t('dashboard.datasets') }}</h2>
        <p class="muted">{{ t('dashboard.datasetCount', { count: datasetStore.datasets.length }) }}</p>
        <p v-if="datasetStore.selected">
          {{
            t('dashboard.currentDataset', {
              name: datasetStore.selected.name,
              channels: datasetStore.selected.channelCount,
              samples: datasetStore.selected.sampleCount.toLocaleString()
            })
          }}
        </p>
        <div class="row dataset-actions">
          <button class="btn btn-primary" type="button" @click="datasetStore.importData()">
            <AppIcon name="download" />
            {{ t('toolbar.import') }}
          </button>
          <button class="btn" type="button" @click="router.push('/data')">
            <AppIcon name="database" />
            {{ t('nav.data') }}
          </button>
          <button class="btn" type="button" :disabled="!datasetStore.selected" @click="router.push('/signal')">
            <AppIcon name="chartLine" />
            {{ t('nav.signal') }}
          </button>
          <button class="btn" type="button" :disabled="!datasetStore.selected" @click="router.push('/spectrum')">
            <AppIcon name="chartBar" />
            {{ t('nav.spectrum') }}
          </button>
          <button class="btn" type="button" :disabled="!datasetStore.selected" @click="router.push('/markers')">
            <AppIcon name="pin" />
            {{ t('nav.markers') }}
          </button>
          <button class="btn" type="button" @click="router.push('/live')">
            <AppIcon name="activity" />
            {{ t('nav.live') }}
          </button>
          <button class="btn" type="button" :disabled="!projectStore.hasProject" @click="router.push('/generator')">
            <AppIcon name="zap" />
            {{ t('nav.generator') }}
          </button>
          <button class="btn" type="button" @click="router.push('/tasks')">
            <AppIcon name="listTodo" />
            {{ t('nav.tasks') }}
          </button>
          <button class="btn" type="button" :disabled="!datasetStore.selected" @click="router.push('/export')">
            <AppIcon name="upload" />
            {{ t('nav.export') }}
          </button>
        </div>
      </article>
    </div>

    <article class="panel recent">
      <div class="recent-head">
        <h2>{{ t('dashboard.recent') }}</h2>
        <button class="btn btn-ghost" type="button" :disabled="projectStore.recent.length === 0" @click="projectStore.clearRecent()">
          <AppIcon name="eraser" />
          {{ t('dashboard.clearRecent') }}
        </button>
      </div>
      <table v-if="projectStore.recent.length > 0" class="table">
        <thead>
          <tr>
            <th>{{ t('common.path') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in projectStore.recent" :key="item">
            <td>{{ formatPath(item) }}</td>
            <td>
              <button class="btn" type="button" data-testid="recent-open" @click="projectStore.openProject(item)">
                <AppIcon name="folderOpen" />
                {{ t('common.open') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">{{ t('dashboard.noRecent') }}</p>
    </article>

    <p v-if="projectStore.current" class="muted">
      {{
        t('dashboard.timestamps', {
          created: formatTimestamp(projectStore.current.file.createdAt),
          modified: formatTimestamp(projectStore.current.file.modifiedAt)
        })
      }}
    </p>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.card,
.recent {
  min-width: 0;
  padding: 16px;
}

h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.dataset-actions .btn {
  flex: 0 1 auto;
}

.recent-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
</style>
