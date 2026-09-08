import type { TaskRecord } from '../types/task'

export function taskDurationMs(
  task: Pick<TaskRecord, 'elapsedMs' | 'runStartedAt' | 'status'>,
  now = Date.now()
): number {
  if (task.status === 'running' && task.runStartedAt !== null) {
    return Math.max(0, task.elapsedMs + (now - task.runStartedAt))
  }
  return Math.max(0, task.elapsedMs)
}

export function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0
  if (progress < 0) return 0
  if (progress > 1) return 1
  return progress
}
