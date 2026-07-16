import type { Point2D } from '../../types/foundation'
import type { GridCoordinate } from '../grid/types'
import type { BubbleDescriptor } from '../shooter/types'

export interface RemovedFloatingBubble {
  readonly coordinate: GridCoordinate
  readonly center: Point2D
  readonly bubble: BubbleDescriptor
}

export interface FloatingRemovalFailure {
  readonly coordinate: GridCoordinate
  readonly reason: 'invalid-coordinate'
}

export interface FloatingResolutionResult {
  readonly ok: boolean
  readonly supportedCoordinates: readonly GridCoordinate[]
  readonly floatingCoordinates: readonly GridCoordinate[]
  readonly removedBubbles: readonly RemovedFloatingBubble[]
  readonly removalFailures: readonly FloatingRemovalFailure[]
  readonly supportedCount: number
  readonly floatingCount: number
  readonly removedCount: number
  readonly removedAny: boolean
}

export interface FallingBubbleVisual {
  readonly id: string
  readonly bubble: BubbleDescriptor
  readonly coordinate: GridCoordinate
  position: Point2D
  velocityY: number
  driftX: number
}
