import type { GameFrame, GameLifecycleState } from '../../types/foundation'

export interface FrameScheduler {
  request(callback: FrameRequestCallback): number
  cancel(handle: number): void
}

export type FrameHandler = (frame: GameFrame) => void

const DEFAULT_MAX_DELTA_MS = 50

export class GameLoop {
  private state: GameLifecycleState = 'idle'
  private frameHandle: number | null = null
  private lastTimestampMs: number | null = null
  private elapsedMs = 0

  public constructor(
    private readonly scheduler: FrameScheduler,
    private readonly onFrame: FrameHandler,
    private readonly maxDeltaMs = DEFAULT_MAX_DELTA_MS,
  ) {
    if (maxDeltaMs <= 0) {
      throw new RangeError('maxDeltaMs must be greater than zero.')
    }
  }

  public get lifecycleState(): GameLifecycleState {
    return this.state
  }

  public start(): void {
    if (this.state === 'running') {
      return
    }

    this.elapsedMs = 0
    this.lastTimestampMs = null
    this.state = 'running'
    this.scheduleNextFrame()
  }

  public pause(): void {
    if (this.state !== 'running') {
      return
    }

    this.cancelScheduledFrame()
    this.lastTimestampMs = null
    this.state = 'paused'
  }

  public resume(): void {
    if (this.state !== 'paused') {
      return
    }

    this.lastTimestampMs = null
    this.state = 'running'
    this.scheduleNextFrame()
  }

  public stop(): void {
    this.cancelScheduledFrame()
    this.lastTimestampMs = null
    this.elapsedMs = 0
    this.state = 'stopped'
  }

  private readonly tick: FrameRequestCallback = (timestampMs) => {
    if (this.state !== 'running') {
      return
    }

    const rawDeltaMs =
      this.lastTimestampMs === null ? 0 : timestampMs - this.lastTimestampMs
    const deltaMs = Math.min(Math.max(rawDeltaMs, 0), this.maxDeltaMs)

    this.lastTimestampMs = timestampMs
    this.elapsedMs += deltaMs
    this.onFrame({ timestampMs, deltaMs, elapsedMs: this.elapsedMs })
    this.scheduleNextFrame()
  }

  private scheduleNextFrame(): void {
    this.frameHandle = this.scheduler.request(this.tick)
  }

  private cancelScheduledFrame(): void {
    if (this.frameHandle === null) {
      return
    }

    this.scheduler.cancel(this.frameHandle)
    this.frameHandle = null
  }
}

export function createBrowserFrameScheduler(): FrameScheduler {
  if (typeof window === 'undefined') {
    throw new Error('The browser frame scheduler requires a window environment.')
  }

  return {
    request: (callback) => window.requestAnimationFrame(callback),
    cancel: (handle) => window.cancelAnimationFrame(handle),
  }
}

