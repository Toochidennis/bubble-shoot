export interface Point2D {
  readonly x: number
  readonly y: number
}

export interface LogicalViewport {
  readonly width: number
  readonly height: number
  readonly pixelRatio: number
}

export type GameLifecycleState = 'idle' | 'running' | 'paused' | 'stopped'

export interface GameFrame {
  readonly timestampMs: number
  readonly deltaMs: number
  readonly elapsedMs: number
}

