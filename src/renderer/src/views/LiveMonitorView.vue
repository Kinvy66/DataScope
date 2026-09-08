<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import LivePlot from '../components/live/LivePlot.vue'
import { DAQ_COMMAND_LABELS, DAQ_STATE_LABELS, type DaqCommand } from '@shared/types/live'
import { WAVEFORM_KINDS } from '@shared/types/generator'
import { useLiveStore } from '../stores/live'
import { useProjectStore } from '../stores/project'
import { formatDuration, formatNumber } from '../utils/format'

const router = useRouter()
const liveStore = useLiveStore()
const projectStore = useProjectStore()

const waveformLabels: Record<(typeof WAVEFORM_KINDS)[number], string> = {
  sine: '正弦波',
  square: '方波',
  triangle: '三角波',
  dc: '直流',
  noise: '随机噪声',
  'multi-frequency': '多频叠加'
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
      <div class="kicker">Live Monitor</div>
      <h1>实时监视</h1>
      <p>Virtual DAQ 在进程内组包、校验并写入环形缓冲，不依赖真实采集卡。传输方式为回环，不是 TCP/UDP 网口。</p>
    </header>

    <div class="layout">
      <aside class="panel controls">
        <h2>{{ liveStore.status?.deviceName ?? 'Virtual DAQ' }}</h2>
        <p class="state">状态：{{ DAQ_STATE_LABELS[liveStore.state] }}</p>
        <p class="muted">
          {{ liveStore.status?.channelCount ?? 0 }} ch ·
          {{ formatNumber(liveStore.status?.sampleRate ?? 0, 3) }} Hz ·
          回环
        </p>

        <div class="field">
          <label for="live-name">设备名称</label>
          <input id="live-name" v-model="liveStore.deviceName" :disabled="!liveStore.status?.canConfigure" />
        </div>
        <div class="grid">
          <div class="field">
            <label for="live-ch">通道数</label>
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
            <label for="live-rate">采样率 (Hz)</label>
            <input
              id="live-rate"
              v-model.number="liveStore.sampleRate"
              type="number"
              min="1"
              :disabled="!liveStore.status?.canConfigure"
            />
          </div>
          <div class="field">
            <label for="live-buf">缓冲点数</label>
            <input
              id="live-buf"
              v-model.number="liveStore.bufferCapacity"
              type="number"
              min="256"
              :disabled="!liveStore.status?.canConfigure"
            />
          </div>
          <div class="field">
            <label for="live-pkt">每包点数</label>
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
          <label for="live-kind">波形</label>
          <select id="live-kind" v-model="liveStore.kind" :disabled="!liveStore.status?.canConfigure">
            <option v-for="item in WAVEFORM_KINDS" :key="item" :value="item">{{ waveformLabels[item] }}</option>
          </select>
        </div>
        <div class="grid">
          <div class="field">
            <label for="live-freq">频率 (Hz)</label>
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
            <label for="live-amp">幅度</label>
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
            {{ DAQ_COMMAND_LABELS[item] }}
          </button>
        </div>

        <div class="field">
          <label for="live-capture">写入工程名称</label>
          <input id="live-capture" v-model="liveStore.captureName" />
        </div>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="liveStore.busy || !liveStore.status?.canCapture || !projectStore.hasProject"
          @click="liveStore.capture()"
        >
          将缓冲写入工程
        </button>
        <p v-if="!projectStore.hasProject" class="muted">写入工程需要先打开工程。</p>
        <button class="btn btn-ghost" type="button" :disabled="!projectStore.hasProject" @click="router.push('/data')">
          打开数据浏览
        </button>
      </aside>

      <div class="stage">
        <LivePlot :channels="liveStore.status?.channels ?? []" :running="running" />
        <article class="panel stats">
          <div>
            <dt>运行时间</dt>
            <dd>{{ elapsed }}</dd>
          </div>
          <div>
            <dt>数据包</dt>
            <dd>{{ (liveStore.status?.packetCount ?? 0).toLocaleString() }}</dd>
          </div>
          <div>
            <dt>丢包（序号缺口）</dt>
            <dd>{{ liveStore.status?.droppedPacketCount ?? 0 }}</dd>
          </div>
          <div>
            <dt>无效包</dt>
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
            <dt>覆盖旧点</dt>
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
