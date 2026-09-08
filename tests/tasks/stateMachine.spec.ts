import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { allowedCommands, canTransition, transition } from '@shared/tasks/stateMachine'

describe('task state machine', () => {
  it('follows pause, resume, cancel and retry', () => {
    let status = transition('running', 'pause')
    expect(status).toBe('paused')
    status = transition(status, 'resume')
    expect(status).toBe('running')
    status = transition(status, 'cancel')
    expect(status).toBe('cancelled')
    status = transition(status, 'retry')
    expect(status).toBe('pending')
    status = transition(status, 'cancel')
    expect(status).toBe('cancelled')
  })

  it('allows retry from failed and completed', () => {
    expect(transition('failed', 'retry')).toBe('pending')
    expect(transition('completed', 'retry')).toBe('pending')
  })

  it('rejects illegal transitions', () => {
    expect(canTransition('running', 'resume')).toBe(false)
    expect(canTransition('paused', 'pause')).toBe(false)
    expect(canTransition('completed', 'cancel')).toBe(false)
    expect(canTransition('pending', 'pause')).toBe(false)
    expect(() => transition('running', 'retry')).toThrow(DataScopeError)
    try {
      transition('completed', 'pause')
      throw new Error('expected failure')
    } catch (error) {
      expect((error as DataScopeError).code).toBe('VALIDATION_ERROR')
    }
  })

  it('lists commands for each status', () => {
    expect(allowedCommands('running')).toEqual(['pause', 'cancel'])
    expect(allowedCommands('paused')).toEqual(['resume', 'cancel'])
    expect(allowedCommands('failed')).toEqual(['retry'])
    expect(allowedCommands('pending')).toEqual(['cancel'])
  })
})
