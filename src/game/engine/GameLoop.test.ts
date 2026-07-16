import { describe, expect, it, vi } from 'vitest'

import { GameLoop, type FrameScheduler } from './GameLoop'

class TestFrameScheduler implements FrameScheduler {
  private callback: FrameRequestCallback | null = null
  private nextHandle = 1

  public request(callback: FrameRequestCallback): number {
    this.callback = callback
    return this.nextHandle++
  }

  public cancel(): void {
    this.callback = null
  }

  public advance(timestampMs: number): void {
    const callback = this.callback
    this.callback = null
    callback?.(timestampMs)
  }
}

describe('GameLoop', () => {
  it('supports start, pause, resume, and stop without advancing while paused', () => {
    const scheduler = new TestFrameScheduler()
    const onFrame = vi.fn()
    const loop = new GameLoop(scheduler, onFrame)

    loop.start()
    scheduler.advance(100)
    scheduler.advance(116)
    loop.pause()
    scheduler.advance(132)

    expect(loop.lifecycleState).toBe('paused')
    expect(onFrame).toHaveBeenCalledTimes(2)
    expect(onFrame).toHaveBeenLastCalledWith({
      timestampMs: 116,
      deltaMs: 16,
      elapsedMs: 16,
    })

    loop.resume()
    scheduler.advance(500)
    expect(onFrame).toHaveBeenLastCalledWith({
      timestampMs: 500,
      deltaMs: 0,
      elapsedMs: 16,
    })

    loop.stop()
    expect(loop.lifecycleState).toBe('stopped')
  })

  it('caps long frame gaps', () => {
    const scheduler = new TestFrameScheduler()
    const onFrame = vi.fn()
    const loop = new GameLoop(scheduler, onFrame, 40)

    loop.start()
    scheduler.advance(0)
    scheduler.advance(500)

    expect(onFrame).toHaveBeenLastCalledWith({
      timestampMs: 500,
      deltaMs: 40,
      elapsedMs: 40,
    })
  })
})

