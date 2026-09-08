<script setup lang="ts">
import AppIcon from '../common/AppIcon.vue'

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  save: []
  discard: []
  cancel: []
}>()
</script>

<template>
  <div class="overlay" @mousedown.self="emit('cancel')">
    <section class="dialog">
      <h2>{{ title }}</h2>
      <p class="muted">当前工程包含未保存的修改，请选择如何处理。</p>
      <footer>
        <button class="btn" type="button" @click="emit('cancel')">
          <AppIcon name="x" />
          取消
        </button>
        <button class="btn" type="button" @click="emit('discard')">
          <AppIcon name="eraser" />
          不保存
        </button>
        <button class="btn btn-primary" type="button" @click="emit('save')">
          <AppIcon name="save" />
          保存
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
  z-index: 21;
}

.dialog {
  width: 420px;
  padding: 20px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
}

h2 {
  margin: 0 0 8px;
  font-size: 18px;
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
</style>
