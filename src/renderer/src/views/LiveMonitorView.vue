<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import LivePlot from '../components/live/LivePlot.vue'
import type { IconName } from '../components/common/icons'
import { DAQ_COMMAND_MESSAGE_KEYS, DAQ_STATE_MESSAGE_KEYS, WAVEFORM_MESSAGE_KEYS } from '@shared/i18n'
import { WAVEFORM_KINDS } from '@shared/types/generator'
import type { DaqCommand } from '@shared/types/live'
import { useI18n } from '../i18n'
import { useLiveStore } from '../stores/live'
import { useProjectStore } from '../stores/project'
import { formatDuration, formatNumber } from '../utils/format'

const router = useRouter()
const liveStore = useLiveStore()
const projectStore = useProjectStore()
const { t } = useI18n()

const commandIcons: Record<DaqCommand, IconName> = {
  connect: 'plug',
  arm: 'shield',
  start: 'play',
  pause: 'pause',
  resume: 'play',
  stop: 'square',
  disconnect: 'power',
  reset: 'rotateCcw'
}

const controls: DaqCommand[] = ['connect', 'arm', 'start', 'pause', 'resume', 'stop', 'disconnect', 'reset']

const elapsed = computed(() => formatDuration((liveStore.status?.elapsedMs ?? 0) / 1000))
const fillPercent = computed(() => Math.round((liveStore.status?.bufferFill ?? 0) * 100))
const running = computed(() => liveStore.state === 'running')

onMounted(() => {
  void liveStore.hydrate()
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('live.kicker') }}</div>
      <h1>{{ t('live.title') }}</h1>
      <p>{{ t('live.desc') }}</p>
    </header>

    <div class="layout">
      <aside class="panel controls">
        <h2>{{ liveStore.status?.deviceName ?? 'Virtual DAQ' }}</h2>
        <p class="state">{{ t('live.state', { state: t(DAQ_STATE_MESSAGE_KEYS[liveStore.state]) }) }}</p>
        <p class="muted">
          {{ liveStore.status?.channelCount ?? 0 }} ch ·
          {{ formatNumber(liveStore.status?.sampleRate ?? 0, 3) }} Hz ·
          {{ t('live.loopback') }}
        </p>

        <div class="field">
          <label for="live-name">{{ t('live.deviceName') }}</label>
          <input id="live-name" v-model="liveStore.deviceName" :disabled="!liveStore.status?.canConfigure" />
        </div>
        <div class="grid">
          <div class="field">
            <label for="live-ch">{{ t('common.channelCount') }}</label>
            <input
              id="live-ch"
              v-model.number="liveStore.channelCount"
              type="number"
              min="1"
              max="16"
              :disabled="!liveStore.status?.canConfigure"
            />
          </div>
          <div class="field">
            <label for="live-rate">{{ t('common.sampleRate') }}</label>
            <input
              id="live-rate"
              v-model.number="liveStore.sampleRate"
              type="number"
              min="1"
              :disabled="!liveStore.status?.canConfigure"
            />
          </div>
          <div class="field">
            <label for="live-buf">{{ t('live.buffer') }}</label>
            <input
              id="live-buf"
              v-model.number="liveStore.bufferCapacity"
              type="number"
              min="256"
              :disabled="!liveStore.status?.canConfigure"
            />
          </div>
          <div class="field">
            <label for="live-pkt">{{ t('live.packet') }}</label>
            <input
              id="live-pkt"
              v-model.number="liveStore.samplesPerPacket"
              type="number"
              min="8"
              max="512"
              :disabled="!liveStore.status?.canConfigure"
            />
          </div>
        </div>
        <div class="field">
          <label for="live-kind">{{ t('live.waveform') }}</label>
          <select id="live-kind" v-model="liveStore.kind" :disabled="!liveStore.status?.canConfigure">
            <option v-for="item in WAVEFORM_KINDS" :key="item" :value="item">{{ t(WAVEFORM_MESSAGE_KEYS[item]) }}</option>
          </select>
        </div>
        <div class="grid">
          <div class="field">
            <label for="live-freq">{{ t('common.frequency') }}</label>
            <input
              id="live-freq"
              v-model.number="liveStore.frequency"
              type="number"
              min="0.0001"
              step="any"
              :disabled="!liveStore.status?.canConfigure || !liveStore.needsFrequency"
            />
          </div>
          <div class="field">
            <label for="live-amp">{{ t('common.amplitude') }}</label>
            <input
              id="live-amp"
              v-model.number="liveStore.amplitude"
              type="number"
              step="any"
              :disabled="!liveStore.status?.canConfigure"
            />
          </div>
        </div>

        <div class="commands">
          <button
            v-for="item in controls"
            :key="item"
            class="btn"
            :class="{ 'btn-primary': item === 'start' || item === 'connect' }"
            type="button"
            :disabled="liveStore.busy || !liveStore.can.has(item)"
            @click="liveStore.command(item)"
          >
            <AppIcon :name="commandIcons[item]" />
            {{ t(DAQ_COMMAND_MESSAGE_KEYS[item]) }}
          </button>
        </div>

        <div class="field">
          <label for="live-capture">{{ t('live.captureName') }}</label>
          <input id="live-capture" v-model="liveStore.captureName" />
        </div>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="liveStore.busy || !liveStore.status?.canCapture || !projectStore.hasProject"
          @click="liveStore.capture()"
        >
          <AppIcon name="hardDrive" />
          {{ t('live.capture') }}
        </button>
        <p v-if="!projectStore.hasProject" class="muted">{{ t('live.needProject') }}</p>
        <button class="btn btn-ghost" type="button" :disabled="!projectStore.hasProject" @click="router.push('/data')">
          <AppIcon name="database" />
          {{ t('live.openData') }}
        </button>
      </aside>

      <div class="stage">
        <LivePlot :channels="liveStore.status?.channels ?? []" :running="running" />
        <article class="panel stats">
          <div>
            <dt>{{ t('live.elapsed') }}</dt>
            <dd>{{ elapsed }}</dd>
          </div>
          <div>
            <dt>{{ t('live.packets') }}</dt>
            <dd>{{ (liveStore.status?.packetCount ?? 0).toLocaleString() }}</dd>
          </div>
          <div>
            <dt>{{ t('live.dropped') }}</dt>
            <dd>{{ liveStore.status?.droppedPacketCount ?? 0 }}</dd>
          </div>
          <div>
            <dt>{{ t('live.invalid') }}</dt>
            <dd>{{ liveStore.status?.invalidPacketCount ?? 0 }}</dd>
          </div>
          <div>
            <dt>Buffer</dt>
            <dd>
              {{ (liveStore.status?.bufferLength ?? 0).toLocaleString() }} /
              {{ (liveStore.status?.bufferCapacity ?? 0).toLocaleString() }}
              （{{ fillPercent }}%）
            </dd>
          </div>
          <div>
            <dt>{{ t('live.overflow') }}</dt>
            <dd>{{ (liveStore.status?.overflowSamples ?? 0).toLocaleString() }}</dd>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.controls,
.stats {
  padding: 16px;
  overflow: auto;
}

.stage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.state {
  margin: 0 0 8px;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.commands {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

dt {
  color: var(--text-muted);
  font-size: 11px;
  text-transform: uppercase;
}

dd {
  margin: 4px 0 0;
}

h2 {
  margin: 0 0 4px;
  font-size: 16px;
}
</style>
