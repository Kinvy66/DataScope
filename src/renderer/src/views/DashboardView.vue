<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project'
import { useDatasetStore } from '../stores/dataset'
import { formatPath, formatTimestamp } from '../utils/format'

const router = useRouter()
const projectStore = useProjectStore()
const datasetStore = useDatasetStore()
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">Dashboard</div>
      <h1>工作台</h1>
      <p>管理工程、导入时序数据，并进入多通道波形工作区。</p>
    </header>

    <div class="grid">
      <article class="panel card">
        <h2>{{ projectStore.hasProject ? projectStore.projectName : '没有打开的工程' }}</h2>
        <p v-if="projectStore.current" class="muted">
          {{ projectStore.current.rootPath }}
        </p>
        <p v-else class="muted">新建或打开一个工程以开始。工程目录包含 project.json、data、exports、analysis 和 logs。</p>
        <div class="row">
          <button class="btn btn-primary" type="button" @click="projectStore.openCreateDialog">新建工程</button>
          <button class="btn" type="button" @click="projectStore.openProject()">打开工程</button>
        </div>
      </article>

      <article class="panel card">
        <h2>数据集</h2>
        <p class="muted">{{ datasetStore.datasets.length }} 个已导入文件</p>
        <p v-if="datasetStore.selected">
          当前：{{ datasetStore.selected.name }} · {{ datasetStore.selected.channelCount }} ch ·
          {{ datasetStore.selected.sampleCount.toLocaleString() }} samples
        </p>
        <div class="row">
          <button class="btn btn-primary" type="button" @click="datasetStore.importData()">导入数据</button>
          <button class="btn" type="button" @click="router.push('/data')">打开数据浏览</button>
          <button class="btn" type="button" :disabled="!datasetStore.selected" @click="router.push('/signal')">
            信号分析
          </button>
          <button class="btn" type="button" :disabled="!datasetStore.selected" @click="router.push('/spectrum')">
            频谱分析
          </button>
        </div>
      </article>
    </div>

    <article class="panel recent">
      <div class="recent-head">
        <h2>最近工程</h2>
        <button class="btn btn-ghost" type="button" :disabled="projectStore.recent.length === 0" @click="projectStore.clearRecent()">
          清除历史
        </button>
      </div>
      <table v-if="projectStore.recent.length > 0" class="table">
        <thead>
          <tr>
            <th>路径</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in projectStore.recent" :key="item">
            <td>{{ formatPath(item) }}</td>
            <td>
              <button class="btn" type="button" @click="projectStore.openProject(item)">打开</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">暂无最近工程。</p>
    </article>

    <p v-if="projectStore.current" class="muted">
      创建于 {{ formatTimestamp(projectStore.current.file.createdAt) }} · 修改于
      {{ formatTimestamp(projectStore.current.file.modifiedAt) }}
    </p>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.card,
.recent {
  padding: 16px;
}

h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.recent-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
