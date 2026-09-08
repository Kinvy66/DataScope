import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { allowedCommands, canTransition, transition } from '@shared/live/stateMachine'

describe('DAQ state machine', () => {
  it('follows the happy path', () => {
    let state = transition('disconnected', 'connect')
    expect(state).toBe('connected')
    state = transition(state, 'arm')
    expect(state).toBe('ready')
    state = transition(state, 'start')
    expect(state).toBe('running')
    state = transition(state, 'pause')
    expect(state).toBe('paused')
    state = transition(state, 'resume')
    expect(state).toBe('running')
    state = transition(state, 'stop')
    expect(state).toBe('stopped')
    state = transition(state, 'arm')
    expect(state).toBe('ready')
    state = transition(state, 'disconnect')
    expect(state).toBe('disconnected')
  })

  it('rejects illegal transitions', () => {
    expect(canTransition('disconnected', 'start')).toBe(false)
    expect(canTransition('running', 'disconnect')).toBe(false)
    expect(canTransition('running', 'connect')).toBe(false)
    expect(canTransition('paused', 'start')).toBe(false)
    expect(() => transition('disconnected', 'start')).toThrow(DataScopeError)
    expect(() => transition('running', 'disconnect')).toThrow(DataScopeError)
    try {
      transition('ready', 'pause')
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('VALIDATION_ERROR')
    }
  })

  it('allows reset only from error', () => {
    expect(canTransition('error', 'reset')).toBe(true)
    expect(transition('error', 'reset')).toBe('disconnected')
    expect(canTransition('running', 'reset')).toBe(false)
    expect(allowedCommands('error')).toEqual(['disconnect', 'reset'])
  })
})
