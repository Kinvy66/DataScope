<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import { WAVEFORM_MESSAGE_KEYS } from '@shared/i18n'
import { WAVEFORM_KINDS } from '@shared/types/generator'
import { useI18n } from '../i18n'
import { useGeneratorStore } from '../stores/generator'
import { useProjectStore } from '../stores/project'
import { formatNumber } from '../utils/format'

const router = useRouter()
const projectStore = useProjectStore()
const generatorStore = useGeneratorStore()
const { t } = useI18n()
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('generator.kicker') }}</div>
      <h1>{{ t('generator.title') }}</h1>
      <p>{{ t('generator.desc') }}</p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>{{ t('generator.needProject') }}</p>
    </div>

    <form v-else class="layout" @submit.prevent="generatorStore.generate()">
      <aside class="panel controls">
        <div class="field">
          <label for="gen-name">{{ t('generator.datasetName') }}</label>
          <input id="gen-name" v-model="generatorStore.name" required />
        </div>
        <div class="field">
          <label for="gen-kind">{{ t('generator.kind') }}</label>
          <select id="gen-kind" v-model="generatorStore.kind">
            <option v-for="item in WAVEFORM_KINDS" :key="item" :value="item">{{ t(WAVEFORM_MESSAGE_KEYS[item]) }}</option>
          </select>
        </div>
        <div class="grid">
          <div class="field">
            <label for="gen-channels">{{ t('common.channelCount') }}</label>
            <input id="gen-channels" v-model.number="generatorStore.channelCount" type="number" min="1" max="32" />
          </div>
          <div class="field">
            <label for="gen-rate">{{ t('common.sampleRate') }}</label>
            <input id="gen-rate" v-model.number="generatorStore.sampleRate" type="number" min="1" step="any" />
          </div>
          <div class="field">
            <label for="gen-duration">{{ t('generator.duration') }}</label>
            <input id="gen-duration" v-model.number="generatorStore.duration" type="number" min="0.001" step="any" />
          </div>
          <div class="field">
            <label for="gen-freq">{{ t('common.frequency') }}</label>
            <input
              id="gen-freq"
              v-model.number="generatorStore.frequency"
              type="number"
              min="0.0001"
              step="any"
              :disabled="!generatorStore.needsFrequency"
            />
          </div>
          <div class="field">
            <label for="gen-amp">{{ t('common.amplitude') }}</label>
            <input id="gen-amp" v-model.number="generatorStore.amplitude" type="number" step="any" />
          </div>
          <div class="field">
            <label for="gen-offset">{{ t('common.offset') }}</label>
            <input id="gen-offset" v-model.number="generatorStore.offset" type="number" step="any" />
          </div>
          <div class="field">
            <label for="gen-noise">{{ t('common.noise') }}</label>
            <input id="gen-noise" v-model.number="generatorStore.noiseLevel" type="number" min="0" step="any" />
          </div>
        </div>
        <p class="muted">
          {{ t('generator.preview', { channels: generatorStore.channelCount, samples: generatorStore.sampleCount.toLocaleString() }) }}
          <span v-if="generatorStore.needsFrequency">
            · {{ t('generator.nyquist', { value: formatNumber(generatorStore.sampleRate / 2, 3) }) }}
          </span>
        </p>
        <div class="row">
          <button class="btn btn-primary" type="submit" :disabled="generatorStore.busy">
            <AppIcon name="zap" />
            {{ generatorStore.busy ? t('generator.busy') : t('generator.run') }}
          </button>
          <button class="btn" type="button" @click="router.push('/data')">
            <AppIcon name="database" />
            {{ t('generator.viewData') }}
          </button>
        </div>
      </aside>

      <article class="panel help">
        <h2>{{ t('common.help') }}</h2>
        <ul>
          <li>{{ t('generator.help1') }}</li>
          <li>{{ t('generator.help2') }}</li>
          <li>{{ t('generator.help3') }}</li>
          <li>{{ t('generator.help4') }}</li>
          <li>{{ t('generator.help5') }}</li>
        </ul>
      </article>
    </form>
  </section>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.controls,
.help {
  padding: 16px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
