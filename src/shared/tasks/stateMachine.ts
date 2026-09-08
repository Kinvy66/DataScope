import { DataScopeError } from '../errors'
import {
  TASK_COMMANDS,
  type TaskCommand,
  type TaskStatus
} from '../types/task'

const TRANSITIONS: Record<TaskStatus, Partial<Record<TaskCommand, TaskStatus>>> = {
  pending: {
    cancel: 'cancelled'
  },
  running: {
    pause: 'paused',
    cancel: 'cancelled'
  },
  paused: {
    resume: 'running',
    cancel: 'cancelled'
  },
  completed: {
    retry: 'pending'
  },
  failed: {
    retry: 'pending'
  },
  cancelled: {
    retry: 'pending'
  }
}

export function canTransition(status: TaskStatus, command: TaskCommand): boolean {
  return TRANSITIONS[status][command] !== undefined
}

export function allowedCommands(status: TaskStatus): TaskCommand[] {
  return TASK_COMMANDS.filter((command) => canTransition(status, command))
}

export function transition(status: TaskStatus, command: TaskCommand): TaskStatus {
  const next = TRANSITIONS[status][command]
  if (!next) {
    throw new DataScopeError(
      'VALIDATION_ERROR',
      `当前状态「${status}」不能执行「${command}」`,
      { status, command }
    )
  }
  return next
}
