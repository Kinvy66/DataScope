<script setup lang="ts">
import { computed } from 'vue'
import {
  AUTOSAVE_INTERVALS,
  VIEWPORT_CACHE_LIMITS,
  type AppLanguage,
  type AutosaveIntervalSec,
  type LogLevelSetting,
  type ViewportCacheLimit
} from '@shared/types/settings'
import { EXPORT_FORMATS, type ExportFormat } from '@shared/types/export'
import { useI18n } from '../i18n'
import { useAppStore } from '../stores/app'
import { getErrorMessage } from '../utils/format'

const appStore = useAppStore()
const { t } = useI18n()
const info = computed(() => appStore.info)

async function applyPartial(partial: Parameters<typeof appStore.updateSettings>[0]): Promise<void> {
  try {
    await appStore.updateSettings(partial)
    appStore.setGlobalError(null)
  } catch (error) {
    appStore.setGlobalError(getErrorMessage(error))
  }
}

function onThemeChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  void appStore.setTheme(value === 'light' ? 'light' : 'dark')
}

function onLanguageChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'zh-CN' || value === 'en-US') {
    void applyPartial({ language: value as AppLanguage })
  }
}

function onLevelChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'DEBUG' || value === 'INFO' || value === 'WARNING' || value === 'ERROR') {
    void applyPartial({ logLevel: value as LogLevelSetting })
  }
}

function onAutosaveChange(event: Event): void {
  const value = Number((event.target as HTMLSelectElement).value)
  if ((AUTOSAVE_INTERVALS as readonly number[]).includes(value)) {
    void applyPartial({ autosaveIntervalSec: value as AutosaveIntervalSec })
  }
}

function onSampleRateChange(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  void applyPartial({ defaultSampleRate: value })
}

function onChannelCountChange(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  void applyPartial({ defaultChannelCount: value })
}

function onExportFormatChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'csv' || value === 'txt' || value === 'json') {
    void applyPartial({ defaultExportFormat: value as ExportFormat })
  }
}

function onCacheChange(event: Event): void {
  const value = Number((event.target as HTMLSelectElement).value)
  if ((VIEWPORT_CACHE_LIMITS as readonly number[]).includes(value)) {
    void applyPartial({ viewportCacheLimit: value as ViewportCacheLimit })
  }
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('settings.kicker') }}</div>
      <h1>{{ t('settings.title') }}</h1>
      <p>{{ t('settings.desc') }}</p>
    </header>
    <div class="panel form">
      <div class="field">
        <label for="language">{{ t('settings.language') }}</label>
        <select id="language" :value="appStore.settings.language" @change="onLanguageChange">
          <option value="zh-CN">{{ t('settings.languageZh') }}</option>
          <option value="en-US">{{ t('settings.languageEn') }}</option>
        </select>
      </div>
      <div class="field">
        <label for="theme">{{ t('settings.theme') }}</label>
        <select id="theme" :value="appStore.settings.theme" @change="onThemeChange">
          <option value="dark">{{ t('settings.themeDark') }}</option>
          <option value="light">{{ t('settings.themeLight') }}</option>
        </select>
      </div>
      <div class="field">
        <label for="log-level">{{ t('settings.logLevel') }}</label>
        <select id="log-level" :value="appStore.settings.logLevel" @change="onLevelChange">
          <option value="DEBUG">DEBUG</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>
      <div class="field">
        <label for="autosave">{{ t('settings.autosave') }}</label>
        <select id="autosave" :value="appStore.settings.autosaveIntervalSec" @change="onAutosaveChange">
          <option v-for="item in AUTOSAVE_INTERVALS" :key="item" :value="item">
            {{ item === 0 ? t('settings.autosaveOff') : t('settings.autosaveSeconds', { n: item }) }}
          </option>
        </select>
      </div>
      <div class="field">
        <label for="default-rate">{{ t('settings.defaultSampleRate') }}</label>
        <input
          id="default-rate"
          type="number"
          min="0.0001"
          max="1000000"
          step="any"
          :value="appStore.settings.defaultSampleRate"
          @change="onSampleRateChange"
        />
      </div>
      <div class="field">
        <label for="default-channels">{{ t('settings.defaultChannelCount') }}</label>
        <input
          id="default-channels"
          type="number"
          min="1"
          max="32"
          step="1"
          :value="appStore.settings.defaultChannelCount"
          @change="onChannelCountChange"
        />
      </div>
      <div class="field">
        <label for="default-format">{{ t('settings.defaultExportFormat') }}</label>
        <select id="default-format" :value="appStore.settings.defaultExportFormat" @change="onExportFormatChange">
          <option v-for="item in EXPORT_FORMATS" :key="item" :value="item">{{ item.toUpperCase() }}</option>
        </select>
      </div>
      <div class="field">
        <label for="viewport-cache">{{ t('settings.viewportCache') }}</label>
        <select id="viewport-cache" :value="appStore.settings.viewportCacheLimit" @change="onCacheChange">
          <option v-for="item in VIEWPORT_CACHE_LIMITS" :key="item" :value="item">
            {{ item === 0 ? t('settings.viewportCacheOff') : t('settings.viewportCacheEntries', { n: item }) }}
          </option>
        </select>
      </div>
      <p class="muted">{{ t('settings.notes') }}</p>
      <dl v-if="info">
        <div><dt>{{ t('settings.app') }}</dt><dd>{{ info.name }} {{ info.version }}</dd></div>
        <div><dt>{{ t('settings.electron') }}</dt><dd>{{ info.electron }}</dd></div>
        <div><dt>{{ t('settings.chrome') }}</dt><dd>{{ info.chrome }}</dd></div>
        <div><dt>{{ t('settings.node') }}</dt><dd>{{ info.node }}</dd></div>
        <div><dt>{{ t('settings.platform') }}</dt><dd>{{ info.platform }}</dd></div>
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
