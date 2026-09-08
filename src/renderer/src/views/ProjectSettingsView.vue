<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from '../components/common/AppIcon.vue'
import { useI18n } from '../i18n'
import { useProjectStore } from '../stores/project'

const projectStore = useProjectStore()
const { t } = useI18n()
const name = ref('')
const description = ref('')
const sampleRate = ref(1000)

watch(
  () => projectStore.current,
  (current) => {
    if (!current) return
    name.value = current.file.name
    description.value = current.file.description
    sampleRate.value = current.file.sampleRate
  },
  { immediate: true }
)

const canSave = computed(() => projectStore.hasProject && name.value.trim().length > 0 && sampleRate.value > 0)

async function save(): Promise<void> {
  await projectStore.update({
    name: name.value,
    description: description.value,
    sampleRate: Number(sampleRate.value)
  })
  await projectStore.save()
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('projectSettings.kicker') }}</div>
      <h1>{{ t('projectSettings.title') }}</h1>
      <p>{{ t('projectSettings.desc') }}</p>
    </header>
    <form v-if="projectStore.hasProject" class="panel form" @submit.prevent="save">
      <div class="field">
        <label for="settings-name">{{ t('common.name') }}</label>
        <input id="settings-name" v-model="name" />
      </div>
      <div class="field">
        <label for="settings-rate">{{ t('common.sampleRate') }}</label>
        <input id="settings-rate" v-model.number="sampleRate" type="number" min="0.0001" step="any" />
      </div>
      <div class="field">
        <label for="settings-description">{{ t('common.description') }}</label>
        <textarea id="settings-description" v-model="description" />
      </div>
      <p class="muted">{{ t('projectSettings.path', { path: projectStore.current?.rootPath ?? '' }) }}</p>
      <button class="btn btn-primary" type="submit" :disabled="!canSave || projectStore.busy">
        <AppIcon name="save" />
        {{ t('projectSettings.save') }}
      </button>
    </form>
    <div v-else class="panel empty-state">
      <p>{{ t('projectSettings.empty') }}</p>
    </div>
  </section>
</template>

<style scoped>
.form {
  max-width: 560px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
