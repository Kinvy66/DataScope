import { DataScopeError, isDataScopeError } from '../errors'

export function cancelledError(): DataScopeError {
  return new DataScopeError('TASK_CANCELLED', '任务已取消')
}

export function isTaskCancelled(error: unknown): boolean {
  return isDataScopeError(error) && error.code === 'TASK_CANCELLED'
}

export interface TaskGate {
  readonly cancelled: boolean
  readonly paused: boolean
  pause(): void
  resume(): void
  cancel(): void
  throwIfCancelled(): void
  checkpoint(): Promise<void>
}

export function createTaskGate(): TaskGate {
  let cancelled = false
  let paused = false
  const waiters: Array<() => void> = []

  function wake(): void {
    while (waiters.length > 0) {
      const resolve = waiters.pop()
      resolve?.()
    }
  }

  return {
    get cancelled() {
      return cancelled
    },
    get paused() {
      return paused
    },
    pause(): void {
      paused = true
    },
    resume(): void {
      paused = false
      wake()
    },
    cancel(): void {
      cancelled = true
      paused = false
      wake()
    },
    throwIfCancelled(): void {
      if (cancelled) {
        throw cancelledError()
      }
    },
    async checkpoint(): Promise<void> {
      if (cancelled) {
        throw cancelledError()
      }
      while (paused && !cancelled) {
        await new Promise<void>((resolve) => {
          waiters.push(resolve)
        })
      }
      if (cancelled) {
        throw cancelledError()
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0)
      })
    }
  }
}
