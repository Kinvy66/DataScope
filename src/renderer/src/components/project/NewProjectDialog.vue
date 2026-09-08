<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '../common/AppIcon.vue'
import { useProjectStore } from '../../stores/project'

const projectStore = useProjectStore()
const name = ref('DemoProject')
const location = ref('')
const description = ref('')

async function chooseLocation(): Promise<void> {
  const selected = await window.datascope.dialog.openDirectory('选择工程位置')
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
        <div class="kicker">Project</div>
        <h2>新建工程</h2>
      </header>
      <div class="field">
        <label for="project-name">名称</label>
        <input id="project-name" v-model="name" maxlength="80" />
      </div>
      <div class="field">
        <label for="project-location">位置</label>
        <div class="row">
          <input id="project-location" v-model="location" placeholder="选择保存目录" />
          <button class="btn" type="button" @click="chooseLocation">
            <AppIcon name="folderOpen" />
            浏览
          </button>
        </div>
      </div>
      <div class="field">
        <label for="project-description">描述</label>
        <textarea id="project-description" v-model="description" />
      </div>
      <p v-if="projectStore.errorMessage" class="muted">{{ projectStore.errorMessage }}</p>
      <footer>
        <button class="btn" type="button" @click="projectStore.closeCreateDialog()">
          <AppIcon name="x" />
          取消
        </button>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="projectStore.busy || !name.trim() || !location.trim()"
          @click="submit"
        >
          <AppIcon name="plus" />
          创建
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
