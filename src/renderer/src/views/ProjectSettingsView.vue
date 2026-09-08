<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useProjectStore } from '../stores/project'

const projectStore = useProjectStore()
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
      <div class="kicker">Project Settings</div>
      <h1>工程设置</h1>
      <p>编辑当前工程的名称、描述和默认采样率。修改后需要保存工程。</p>
    </header>
    <form v-if="projectStore.hasProject" class="panel form" @submit.prevent="save">
      <div class="field">
        <label for="settings-name">名称</label>
        <input id="settings-name" v-model="name" />
      </div>
      <div class="field">
        <label for="settings-rate">采样率 (Hz)</label>
        <input id="settings-rate" v-model.number="sampleRate" type="number" min="0.0001" step="any" />
      </div>
      <div class="field">
        <label for="settings-description">描述</label>
        <textarea id="settings-description" v-model="description" />
      </div>
      <p class="muted">路径：{{ projectStore.current?.rootPath }}</p>
      <button class="btn btn-primary" type="submit" :disabled="!canSave || projectStore.busy">保存工程</button>
    </form>
    <div v-else class="panel empty-state">
      <p>当前没有打开的工程。</p>
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
