import { DataScopeError } from '../errors'
import {
  DAQ_COMMANDS,
  type DaqCommand,
  type DaqState
} from '../types/live'

const TRANSITIONS: Record<DaqState, Partial<Record<DaqCommand, DaqState>>> = {
  disconnected: {
    connect: 'connected'
  },
  connected: {
    arm: 'ready',
    disconnect: 'disconnected'
  },
  ready: {
    start: 'running',
    disconnect: 'disconnected'
  },
  running: {
    pause: 'paused',
    stop: 'stopped'
  },
  paused: {
    resume: 'running',
    stop: 'stopped'
  },
  stopped: {
    arm: 'ready',
    disconnect: 'disconnected'
  },
  error: {
    reset: 'disconnected',
    disconnect: 'disconnected'
  }
}

export function canTransition(state: DaqState, command: DaqCommand): boolean {
  return TRANSITIONS[state][command] !== undefined
}

export function allowedCommands(state: DaqState): DaqCommand[] {
  return DAQ_COMMANDS.filter((command) => canTransition(state, command))
}

export function transition(state: DaqState, command: DaqCommand): DaqState {
  const next = TRANSITIONS[state][command]
  if (!next) {
    throw new DataScopeError(
      'VALIDATION_ERROR',
      `当前状态「${state}」不能执行「${command}」`,
      { state, command }
    )
  }
  return next
}
