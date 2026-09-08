import { describe, expect, it } from 'vitest'
import { clampProgress, taskDurationMs } from '@shared/tasks/model'

describe('task duration and progress', () => {
  it('adds the current running segment', () => {
    expect(
      taskDurationMs({ elapsedMs: 1000, runStartedAt: 10_000, status: 'running' }, 12_000)
    ).toBe(3000)
  })

  it('freezes while paused or finished', () => {
    expect(taskDurationMs({ elapsedMs: 500, runStartedAt: null, status: 'paused' }, 99_000)).toBe(
      500
    )
    expect(
      taskDurationMs({ elapsedMs: 800, runStartedAt: null, status: 'completed' }, 99_000)
    ).toBe(800)
  })

  it('clamps progress to 0–1', () => {
    expect(clampProgress(-1)).toBe(0)
    expect(clampProgress(0.4)).toBe(0.4)
    expect(clampProgress(2)).toBe(1)
    expect(clampProgress(Number.NaN)).toBe(0)
  })
})
