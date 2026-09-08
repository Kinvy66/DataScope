<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div class="overlay" @mousedown.self="emit('cancel')">
    <section class="dialog" role="dialog" aria-modal="true">
      <h2>{{ title }}</h2>
      <p class="muted">{{ message }}</p>
      <footer>
        <button class="btn" type="button" @click="emit('cancel')">
          <AppIcon name="x" />
          取消
        </button>
        <button
          class="btn"
          :class="danger ? 'btn-danger' : 'btn-primary'"
          type="button"
          @click="emit('confirm')"
        >
          <AppIcon :name="danger ? 'trash' : 'check'" />
          {{ confirmLabel ?? '确定' }}
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
