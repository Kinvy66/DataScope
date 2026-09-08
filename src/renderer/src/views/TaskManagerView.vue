<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import AppIcon from '../components/common/AppIcon.vue'
import { taskDurationMs } from '@shared/tasks/model'
import {
  TASK_COMMAND_MESSAGE_KEYS,
  TASK_KIND_MESSAGE_KEYS,
  TASK_STATUS_MESSAGE_KEYS
} from '@shared/i18n'
import {
  TASK_STATUSES,
  type TaskCommand,
  type TaskRecord,
  type TaskStatus
} from '@shared/types/task'
import { useI18n } from '../i18n'
import { useTaskStore } from '../stores/task'
import { formatElapsedMs, formatTimestamp } from '../utils/format'

const taskStore = useTaskStore()
const { t } = useI18n()
const statusFilter = ref('')
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const visible = computed(() => {
  if (!statusFilter.value) return taskStore.tasks
  return taskStore.tasks.filter((task) => task.status === statusFilter.value)
})

watch(
  () => taskStore.activeCount,
  (count) => {
    if (count > 0 && timer === null) {
      timer = setInterval(() => {
        now.value = Date.now()
      }, 500)
    }
    if (count === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
      now.value = Date.now()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
})

function durationOf(task: TaskRecord): string {
  return formatElapsedMs(taskDurationMs(task, now.value))
}

function percent(task: TaskRecord): string {
  return `${Math.round(task.progress * 100)}%`
}

async function runCommand(task: TaskRecord, command: TaskCommand): Promise<void> {
  await taskStore.command(task.id, command)
}

const commandIcons: Record<TaskCommand, 'pause' | 'play' | 'square' | 'rotateCcw'> = {
  pause: 'pause',
  resume: 'play',
  cancel: 'square',
  retry: 'rotateCcw'
}

const statusOptions: TaskStatus[] = [...TASK_STATUSES]
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ t('task.kicker') }}</div>
      <h1>{{ t('task.title') }}</h1>
      <p>
        {{ t('task.desc') }}
      </p>
    </header>

    <div class="filters">
      <select v-model="statusFilter">
        <option value="">{{ t('task.allStatus') }}</option>
        <option v-for="status in statusOptions" :key="status" :value="status">
          {{ t(TASK_STATUS_MESSAGE_KEYS[status]) }}
        </option>
      </select>
      <button
        class="btn"
        type="button"
        :disabled="!taskStore.hasFinished || taskStore.busyId === 'clear'"
        @click="taskStore.clearFinished()"
      >
        <AppIcon name="eraser" />
        {{ t('task.clearFinished') }}
      </button>
    </div>

    <div class="panel list-panel">
      <table v-if="visible.length > 0" class="table">
        <thead>
          <tr>
            <th>{{ t('task.colTask') }}</th>
            <th>{{ t('task.colKind') }}</th>
            <th>{{ t('task.colStatus') }}</th>
            <th>{{ t('task.colProgress') }}</th>
            <th>{{ t('task.colDuration') }}</th>
            <th>{{ t('task.colStarted') }}</th>
            <th>{{ t('task.colMessage') }}</th>
            <th>{{ t('task.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in visible" :key="task.id">
            <td>
              <div class="title">{{ task.title }}</div>
              <div v-if="task.resultLabel" class="muted result">{{ task.resultLabel }}</div>
            </td>
            <td>{{ t(TASK_KIND_MESSAGE_KEYS[task.kind]) }}</td>
            <td>
              <span class="status" :data-status="task.status">{{ t(TASK_STATUS_MESSAGE_KEYS[task.status]) }}</span>
            </td>
            <td>
              <div class="progress-cell">
                <div class="progress" :title="percent(task)">
                  <span :style="{ width: percent(task) }"></span>
                </div>
                <span>{{ percent(task) }}</span>
              </div>
            </td>
            <td>{{ durationOf(task) }}</td>
            <td>{{ task.startedAt ? formatTimestamp(task.startedAt) : '—' }}</td>
            <td class="message">
              <span>{{ task.error || task.message || '—' }}</span>
            </td>
            <td>
              <div class="actions">
                <button
                  v-for="command in task.allowedCommands"
                  :key="command"
                  class="btn"
                  :class="{ 'btn-danger': command === 'cancel' }"
                  type="button"
                  :disabled="taskStore.busyId === task.id"
                  @click="runCommand(task, command)"
                >
                  <AppIcon :name="commandIcons[command]" />
                  {{ t(TASK_COMMAND_MESSAGE_KEYS[command]) }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted empty">
        {{ statusFilter ? t('task.emptyFilter') : t('task.empty') }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 8px;
}

.filters select {
  height: 34px;
  border: 1px solid var(--border);
  background: var(--bg-panel);
  border-radius: 6px;
  padding: 0 10px;
}

.list-panel {
  padding: 8px 0;
  overflow: auto;
}

.title {
  font-weight: 600;
}

.result {
  font-size: 11px;
  margin-top: 2px;
}

.status[data-status='running'] {
  color: var(--accent);
}

.status[data-status='paused'] {
  color: var(--warning);
}

.status[data-status='completed'] {
  color: var(--accent);
}

.status[data-status='failed'] {
  color: var(--danger);
}

.status[data-status='cancelled'],
.status[data-status='pending'] {
  color: var(--text-muted);
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress {
  width: 96px;
  height: 6px;
  border-radius: 999px;
  background: var(--bg-app);
  overflow: hidden;
}

.progress span {
  display: block;
  height: 100%;
  background: var(--accent);
}

.message {
  white-space: normal;
  min-width: 140px;
  max-width: 280px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.empty {
  padding: 16px;
}
</style>
