import { BrowserWindow } from 'electron'
import { IpcChannel } from '@shared/ipc-channels'
import { DataScopeError, toErrorPayload } from '@shared/errors'
import { createId } from '@shared/parsers/common'
import { cancelledError, createTaskGate, isTaskCancelled, type TaskGate } from '@shared/tasks/gate'
import { clampProgress, taskDurationMs } from '@shared/tasks/model'
import { allowedCommands, transition } from '@shared/tasks/stateMachine'
import {
  TASK_COMMANDS,
  isActiveTaskStatus,
  isTerminalTaskStatus,
  type TaskCommand,
  type TaskContext,
  type TaskKind,
  type TaskPayload,
  type TaskRecord,
  type TaskWorker
} from '@shared/types/task'
import { logger } from './logger'

const MAX_TASKS = 100

interface InternalTask {
  record: TaskRecord
  payload: TaskPayload
  gate: TaskGate
  running: Promise<unknown> | null
}

class TaskService {
  private readonly tasks = new Map<string, InternalTask>()
  private readonly workers = new Map<TaskKind, TaskWorker>()

  registerWorker(kind: TaskKind, worker: TaskWorker): void {
    this.workers.set(kind, worker)
  }

  list(): TaskRecord[] {
    return [...this.tasks.values()]
      .map((item) => this.snapshot(item))
      .sort((left, right) => right.createdAt - left.createdAt)
  }

  get(id: string): TaskRecord {
    return this.snapshot(this.require(id))
  }

  async run<T>(title: string, payload: TaskPayload): Promise<T> {
    const item = this.create(title, payload)
    return (await this.execute(item)) as T
  }

  command(id: string, command: TaskCommand): TaskRecord {
    if (!TASK_COMMANDS.includes(command)) {
      throw new DataScopeError('VALIDATION_ERROR', `不支持的任务命令: ${String(command)}`)
    }
    const item = this.require(id)
    transition(item.record.status, command)

    if (command === 'pause') {
      item.gate.pause()
      this.freezeElapsed(item)
      item.record.status = 'paused'
      item.record.message = item.record.message || '已暂停'
      this.syncDerived(item)
      this.emit(item)
      return this.snapshot(item)
    }

    if (command === 'resume') {
      item.gate.resume()
      this.unfreezeElapsed(item)
      item.record.status = 'running'
      this.syncDerived(item)
      this.emit(item)
      return this.snapshot(item)
    }

    if (command === 'cancel') {
      item.gate.cancel()
      this.freezeElapsed(item)
      item.record.status = 'cancelled'
      item.record.message = '已取消'
      item.record.finishedAt = Date.now()
      this.syncDerived(item)
      this.emit(item)
      return this.snapshot(item)
    }

    this.resetForRetry(item)
    void this.execute(item).catch(() => undefined)
    return this.snapshot(item)
  }

  clearFinished(): TaskRecord[] {
    for (const [id, item] of this.tasks) {
      if (isTerminalTaskStatus(item.record.status)) {
        this.tasks.delete(id)
      }
    }
    return this.list()
  }

  async cancelAll(): Promise<void> {
    const waiting: Array<Promise<unknown>> = []
    for (const item of this.tasks.values()) {
      if (!isActiveTaskStatus(item.record.status)) continue
      item.gate.cancel()
      this.freezeElapsed(item)
      item.record.status = 'cancelled'
      item.record.message = '已取消'
      item.record.finishedAt = Date.now()
      this.syncDerived(item)
      this.emit(item)
      if (item.running) {
        waiting.push(item.running.catch(() => undefined))
      }
    }
    await Promise.all(waiting)
  }

  private create(title: string, payload: TaskPayload): InternalTask {
    this.prune()
    const createdAt = Date.now()
    const record: TaskRecord = {
      id: createId('task'),
      kind: payload.kind,
      title,
      status: 'pending',
      progress: 0,
      message: '排队中',
      error: null,
      createdAt,
      startedAt: null,
      finishedAt: null,
      elapsedMs: 0,
      runStartedAt: null,
      durationMs: 0,
      resultLabel: null,
      allowedCommands: allowedCommands('pending')
    }
    const item: InternalTask = {
      record,
      payload,
      gate: createTaskGate(),
      running: null
    }
    this.tasks.set(record.id, item)
    this.emit(item)
    return item
  }

  private async execute(item: InternalTask): Promise<unknown> {
    const worker = this.workers.get(item.record.kind)
    if (!worker) {
      throw new DataScopeError('UNKNOWN', `未注册的任务类型: ${item.record.kind}`)
    }

    const work = this.runWorker(item, worker)
    item.running = work
    try {
      return await work
    } finally {
      item.running = null
    }
  }

  private async runWorker(item: InternalTask, worker: TaskWorker): Promise<unknown> {
    item.record.status = 'running'
    item.record.startedAt = Date.now()
    item.record.finishedAt = null
    item.record.error = null
    item.record.message = '运行中'
    this.unfreezeElapsed(item)
    this.syncDerived(item)
    this.emit(item)
    await logger.write('INFO', 'Task Start', 'main', {
      id: item.record.id,
      kind: item.record.kind,
      title: item.record.title
    })

    try {
      const result = await worker(item.payload, this.createContext(item))
      if (item.gate.cancelled) {
        throw cancelledError()
      }
      this.freezeElapsed(item)
      item.record.status = 'completed'
      item.record.progress = 1
      item.record.message = '已完成'
      item.record.finishedAt = Date.now()
      item.record.resultLabel = resultLabelOf(result)
      this.syncDerived(item)
      this.emit(item)
      await logger.write('INFO', 'Task Complete', 'main', {
        id: item.record.id,
        kind: item.record.kind,
        title: item.record.title
      })
      return result
    } catch (error) {
      this.freezeElapsed(item)
      item.record.finishedAt = Date.now()
      if (isTaskCancelled(error) || item.gate.cancelled) {
        item.record.status = 'cancelled'
        item.record.message = '已取消'
        item.record.error = null
        this.syncDerived(item)
        this.emit(item)
        await logger.write('INFO', 'Task Cancelled', 'main', {
          id: item.record.id,
          kind: item.record.kind
        })
        throw cancelledError()
      }

      const payload = toErrorPayload(error)
      item.record.status = 'failed'
      item.record.message = '失败'
      item.record.error = payload.message
      this.syncDerived(item)
      this.emit(item)
      await logger.write('ERROR', 'Task Failed', 'main', {
        id: item.record.id,
        kind: item.record.kind,
        error: payload.message
      })
      throw error
    }
  }

  private createContext(item: InternalTask): TaskContext {
    return {
      id: item.record.id,
      throwIfCancelled: () => item.gate.throwIfCancelled(),
      checkpoint: () => item.gate.checkpoint(),
      report: (progress, message) => {
        item.gate.throwIfCancelled()
        item.record.progress = clampProgress(progress)
        item.record.message = message
        this.syncDerived(item)
        this.emit(item)
      }
    }
  }

  private resetForRetry(item: InternalTask): void {
    item.gate = createTaskGate()
    item.record.status = 'pending'
    item.record.progress = 0
    item.record.message = '重新开始'
    item.record.error = null
    item.record.startedAt = null
    item.record.finishedAt = null
    item.record.elapsedMs = 0
    item.record.runStartedAt = null
    item.record.resultLabel = null
    this.syncDerived(item)
    this.emit(item)
  }

  private freezeElapsed(item: InternalTask): void {
    if (item.record.runStartedAt === null) return
    item.record.elapsedMs += Date.now() - item.record.runStartedAt
    item.record.runStartedAt = null
  }

  private unfreezeElapsed(item: InternalTask): void {
    if (item.record.runStartedAt !== null) return
    item.record.runStartedAt = Date.now()
  }

  private snapshot(item: InternalTask): TaskRecord {
    return {
      ...item.record,
      durationMs: taskDurationMs(item.record),
      allowedCommands: allowedCommands(item.record.status)
    }
  }

  private syncDerived(item: InternalTask): void {
    item.record.durationMs = taskDurationMs(item.record)
    item.record.allowedCommands = allowedCommands(item.record.status)
  }

  private require(id: string): InternalTask {
    const item = this.tasks.get(id)
    if (!item) {
      throw new DataScopeError('VALIDATION_ERROR', `未找到任务: ${id}`, { id })
    }
    return item
  }

  private prune(): void {
    if (this.tasks.size < MAX_TASKS) return
    const finished = [...this.tasks.values()]
      .filter((item) => isTerminalTaskStatus(item.record.status))
      .sort((left, right) => left.record.createdAt - right.record.createdAt)
    for (const item of finished) {
      if (this.tasks.size < MAX_TASKS) break
      this.tasks.delete(item.record.id)
    }
  }

  private emit(item: InternalTask): void {
    const snapshot = this.snapshot(item)
    item.record.durationMs = snapshot.durationMs
    item.record.allowedCommands = snapshot.allowedCommands
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(IpcChannel.TaskUpdated, snapshot)
    }
  }
}

function resultLabelOf(result: unknown): string | null {
  if (typeof result !== 'object' || result === null) return null
  if ('name' in result && typeof result.name === 'string' && result.name.trim()) {
    return result.name
  }
  if ('datasetName' in result && typeof result.datasetName === 'string' && result.datasetName.trim()) {
    return result.datasetName
  }
  return null
}

export const taskService = new TaskService()
