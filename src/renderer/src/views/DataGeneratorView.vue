<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import { useGeneratorStore } from '../stores/generator'
import { useProjectStore } from '../stores/project'
import { formatNumber } from '../utils/format'

const router = useRouter()
const projectStore = useProjectStore()
const generatorStore = useGeneratorStore()
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">Data Generator</div>
      <h1>数据发生器</h1>
      <p>生成正弦、方波、三角波、直流、噪声或多频信号，并写入当前工程的 data 目录。</p>
    </header>

    <div v-if="!projectStore.hasProject" class="panel empty-state">
      <p>请先新建或打开工程，再生成测试数据。</p>
    </div>

    <form v-else class="layout" @submit.prevent="generatorStore.generate()">
      <aside class="panel controls">
        <div class="field">
          <label for="gen-name">数据集名称</label>
          <input id="gen-name" v-model="generatorStore.name" required />
        </div>
        <div class="field">
          <label for="gen-kind">波形类型</label>
          <select id="gen-kind" v-model="generatorStore.kind">
            <option value="sine">正弦波</option>
            <option value="square">方波</option>
            <option value="triangle">三角波</option>
            <option value="dc">直流</option>
            <option value="noise">随机噪声</option>
            <option value="multi-frequency">多频叠加</option>
          </select>
        </div>
        <div class="grid">
          <div class="field">
            <label for="gen-channels">通道数</label>
            <input id="gen-channels" v-model.number="generatorStore.channelCount" type="number" min="1" max="32" />
          </div>
          <div class="field">
            <label for="gen-rate">采样率 (Hz)</label>
            <input id="gen-rate" v-model.number="generatorStore.sampleRate" type="number" min="1" step="any" />
          </div>
          <div class="field">
            <label for="gen-duration">时长 (s)</label>
            <input id="gen-duration" v-model.number="generatorStore.duration" type="number" min="0.001" step="any" />
          </div>
          <div class="field">
            <label for="gen-freq">频率 (Hz)</label>
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
            <label for="gen-amp">幅度</label>
            <input id="gen-amp" v-model.number="generatorStore.amplitude" type="number" step="any" />
          </div>
          <div class="field">
            <label for="gen-offset">偏置</label>
            <input id="gen-offset" v-model.number="generatorStore.offset" type="number" step="any" />
          </div>
          <div class="field">
            <label for="gen-noise">噪声水平</label>
            <input id="gen-noise" v-model.number="generatorStore.noiseLevel" type="number" min="0" step="any" />
          </div>
        </div>
        <p class="muted">
          将生成 {{ generatorStore.channelCount }} 通道 × {{ generatorStore.sampleCount.toLocaleString() }} 点
          <span v-if="generatorStore.needsFrequency">
            · 奈奎斯特 {{ formatNumber(generatorStore.sampleRate / 2, 3) }} Hz
          </span>
        </p>
        <div class="row">
          <button class="btn btn-primary" type="submit" :disabled="generatorStore.busy">
            <AppIcon name="zap" />
            {{ generatorStore.busy ? '生成中…' : '生成并加入工程' }}
          </button>
          <button class="btn" type="button" @click="router.push('/data')">
            <AppIcon name="database" />
            查看数据浏览
          </button>
        </div>
      </aside>

      <article class="panel help">
        <h2>说明</h2>
        <ul>
          <li>各通道使用相同波形，相位按通道均匀错开，便于在波形页区分。</li>
          <li>多频叠加为基频 + 2 倍频 + 3 倍频。</li>
          <li>生成结果保存为 JSON，可重新打开工程后继续使用。</li>
          <li>单通道最多 1,000,000 点，最多 32 通道。频率必须低于采样率的一半。</li>
          <li>生成后可到波形、信号分析、频谱分析中验证。</li>
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
