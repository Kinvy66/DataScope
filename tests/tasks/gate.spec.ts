import { describe, expect, it } from 'vitest'
import { DataScopeError } from '@shared/errors'
import { createTaskGate, isTaskCancelled } from '@shared/tasks/gate'

describe('task gate', () => {
  it('throws after cancel', async () => {
    const gate = createTaskGate()
    gate.cancel()
    expect(gate.cancelled).toBe(true)
    await expect(gate.checkpoint()).rejects.toSatisfy(
      (error: unknown) => isTaskCancelled(error) && (error as DataScopeError).message === '任务已取消'
    )
  })

  it('waits while paused and continues after resume', async () => {
    const gate = createTaskGate()
    gate.pause()
    let released = false
    const pending = gate.checkpoint().then(() => {
      released = true
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(released).toBe(false)
    gate.resume()
    await pending
    expect(released).toBe(true)
  })

  it('wakes a paused checkpoint when cancelled', async () => {
    const gate = createTaskGate()
    gate.pause()
    const pending = gate.checkpoint()
    gate.cancel()
    await expect(pending).rejects.toSatisfy((error: unknown) => isTaskCancelled(error))
  })
})
