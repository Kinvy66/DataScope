import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  isActiveTaskStatus,
  isTerminalTaskStatus,
  type TaskCommand,
  type TaskRecord
} from '@shared/types/task'
import { getErrorMessage } from '../utils/format'
import { useAppStore } from './app'
import { useDatasetStore } from './dataset'
import { useProjectStore } from './project'

const DATASET_TASK_KINDS = new Set(['import', 'generate', 'filter'])

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<TaskRecord[]>([])
  const busyId = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const activeCount = computed(
    () => tasks.value.filter((task) => isActiveTaskStatus(task.status)).length
  )
  const runningCount = computed(
    () => tasks.value.filter((task) => task.status === 'running').length
  )
  const pausedCount = computed(
    () => tasks.value.filter((task) => task.status === 'paused').length
  )
  const hasFinished = computed(
    () => tasks.value.some((task) => isTerminalTaskStatus(task.status))
  )

  function upsert(record: TaskRecord): void {
    const index = tasks.value.findIndex((task) => task.id === record.id)
    if (index >= 0) {
      tasks.value[index] = record
      return
    }
    tasks.value = [record, ...tasks.value]
  }

  function applySideEffects(record: TaskRecord): void {
    if (record.status !== 'completed' || !DATASET_TASK_KINDS.has(record.kind)) return
    void useProjectStore().hydrate()
    void useDatasetStore().refresh()
  }

  async function hydrate(): Promise<void> {
    tasks.value = await window.datascope.task.list()
    unsubscribe?.()
    unsubscribe = window.datascope.task.onUpdated((record) => {
      upsert(record)
      applySideEffects(record)
    })
  }

  async function command(taskId: string, commandName: TaskCommand): Promise<void> {
    busyId.value = taskId
    try {
      const next = await window.datascope.task.command(taskId, commandName)
      upsert(next)
      useAppStore().setGlobalError(null)
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
      await window.datascope.log.write({ level: 'ERROR', message })
    } finally {
      busyId.value = null
    }
  }

  async function clearFinished(): Promise<void> {
    busyId.value = 'clear'
    try {
      tasks.value = await window.datascope.task.clearFinished()
      useAppStore().setGlobalError(null)
    } catch (error) {
      const message = getErrorMessage(error)
      useAppStore().setGlobalError(message)
    } finally {
      busyId.value = null
    }
  }

  return {
    tasks,
    busyId,
    activeCount,
    runningCount,
    pausedCount,
    hasFinished,
    hydrate,
    command,
    clearFinished
  }
})
