<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppLayout from './components/layout/AppLayout.vue'
import { useAppStore } from './stores/app'

const appStore = useAppStore()
const theme = computed(() => appStore.settings.theme)

onMounted(() => {
  void appStore.initialize()
})
</script>

<template>
  <div class="app-root" :data-theme="theme">
    <AppLayout />
  </div>
</template>

<style scoped>
.app-root {
  height: 100%;
}
</style>
