<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const info = computed(() => appStore.info)

function onThemeChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  void appStore.setTheme(value === 'light' ? 'light' : 'dark')
}

function onLevelChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'DEBUG' || value === 'INFO' || value === 'WARNING' || value === 'ERROR') {
    void appStore.updateSettings({ logLevel: value })
  }
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">Application Settings</div>
      <h1>应用设置</h1>
      <p>配置主题、日志级别，并查看运行时信息。Renderer 不直接访问 Node.js API。</p>
    </header>
    <div class="panel form">
      <div class="field">
        <label for="theme">主题</label>
        <select id="theme" :value="appStore.settings.theme" @change="onThemeChange">
          <option value="dark">深色</option>
          <option value="light">浅色</option>
        </select>
      </div>
      <div class="field">
        <label for="log-level">日志级别</label>
        <select id="log-level" :value="appStore.settings.logLevel" @change="onLevelChange">
          <option value="DEBUG">DEBUG</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>
      <dl v-if="info">
        <div><dt>应用</dt><dd>{{ info.name }} {{ info.version }}</dd></div>
        <div><dt>Electron</dt><dd>{{ info.electron }}</dd></div>
        <div><dt>Chrome</dt><dd>{{ info.chrome }}</dd></div>
        <div><dt>Node</dt><dd>{{ info.node }}</dd></div>
        <div><dt>平台</dt><dd>{{ info.platform }}</dd></div>
      </dl>
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

dl {
  display: grid;
  gap: 8px;
  margin: 8px 0 0;
}

dt {
  color: var(--text-muted);
  font-size: 12px;
}

dd {
  margin: 2px 0 0;
}
</style>
