import type { AnalysisRequest } from './analysis'
import type { SourceFormat } from './dataset'
import type { FilterRequest } from './filter'
import type { GeneratorRequest } from './generator'
import type { SpectrumRequest } from './spectrum'

export const TASK_STATUSES = [
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled'
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_KINDS = ['import', 'generate', 'filter', 'analyze', 'spectrum'] as const
export type TaskKind = (typeof TASK_KINDS)[number]

export const TASK_COMMANDS = ['pause', 'resume', 'cancel', 'retry'] as const
export type TaskCommand = (typeof TASK_COMMANDS)[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '等待',
  running: '运行中',
  paused: '已暂停',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消'
}

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  import: '导入',
  generate: '生成',
  filter: '滤波',
  analyze: '时域分析',
  spectrum: '频谱分析'
}

export const TASK_COMMAND_LABELS: Record<TaskCommand, string> = {
  pause: '暂停',
  resume: '继续',
  cancel: '取消',
  retry: '重试'
}

export type TaskPayload =
  | { kind: 'import'; filePath: string; format: SourceFormat }
  | { kind: 'generate'; request: GeneratorRequest }
  | { kind: 'filter'; request: FilterRequest }
  | { kind: 'analyze'; request: AnalysisRequest }
  | { kind: 'spectrum'; request: SpectrumRequest }

export interface TaskContext {
  readonly id: string
  throwIfCancelled(): void
  checkpoint(): Promise<void>
  report(progress: number, message: string): void
}

export interface TaskRecord {
  id: string
  kind: TaskKind
  title: string
  status: TaskStatus
  progress: number
  message: string
  error: string | null
  createdAt: number
  startedAt: number | null
  finishedAt: number | null
  elapsedMs: number
  runStartedAt: number | null
  durationMs: number
  resultLabel: string | null
  allowedCommands: TaskCommand[]
}

export type TaskWorker = (payload: TaskPayload, ctx: TaskContext) => Promise<unknown>

export function isActiveTaskStatus(status: TaskStatus): boolean {
  return status === 'pending' || status === 'running' || status === 'paused'
}

export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}
