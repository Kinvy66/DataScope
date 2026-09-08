<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '../common/AppIcon.vue'
import { useI18n } from '../../i18n'
import { useProjectStore } from '../../stores/project'

const projectStore = useProjectStore()
const { t } = useI18n()
const name = ref('DemoProject')
const location = ref('')
const description = ref('')

async function chooseLocation(): Promise<void> {
  const selected = await window.datascope.dialog.openDirectory(t('dialog.chooseProjectLocation'))
  if (selected) location.value = selected
}

async function submit(): Promise<void> {
  await projectStore.create({
    name: name.value,
    location: location.value,
    description: description.value
  })
}
</script>

<template>
  <div class="overlay" @mousedown.self="projectStore.closeCreateDialog()">
    <section class="dialog">
      <header>
        <div class="kicker">{{ t('newProject.kicker') }}</div>
        <h2>{{ t('newProject.title') }}</h2>
      </header>
      <div class="field">
        <label for="project-name">{{ t('common.name') }}</label>
        <input id="project-name" v-model="name" maxlength="80" />
      </div>
      <div class="field">
        <label for="project-location">{{ t('newProject.location') }}</label>
        <div class="row">
          <input id="project-location" v-model="location" :placeholder="t('newProject.locationPlaceholder')" />
          <button class="btn" type="button" @click="chooseLocation">
            <AppIcon name="folderOpen" />
            {{ t('common.browse') }}
          </button>
        </div>
      </div>
      <div class="field">
        <label for="project-description">{{ t('common.description') }}</label>
        <textarea id="project-description" v-model="description" />
      </div>
      <p v-if="projectStore.errorMessage" class="muted">{{ projectStore.errorMessage }}</p>
      <footer>
        <button class="btn" type="button" @click="projectStore.closeCreateDialog()">
          <AppIcon name="x" />
          {{ t('common.cancel') }}
        </button>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="projectStore.busy || !name.trim() || !location.trim()"
          @click="submit"
        >
          <AppIcon name="plus" />
          {{ t('common.create') }}
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 20;
}

.dialog {
  width: 480px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
}

h2 {
  margin: 4px 0 0;
  font-size: 18px;
}

.row {
  display: flex;
  gap: 8px;
}

.row input {
  flex: 1;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--border);
  background: var(--bg-app);
  border-radius: 6px;
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
