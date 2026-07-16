import type { GridCoordinate } from '../grid/types'
import type { BubbleColor, BubbleDescriptor } from '../shooter/types'

export interface RemovedMatchBubble {
  readonly coordinate: GridCoordinate
  readonly bubble: BubbleDescriptor
}

export interface MatchConfig {
  readonly threshold: number
}

export type MatchFailureReason = 'invalid-origin' | 'empty-origin'

export type MatchResult =
  | {
      readonly ok: false
      readonly matched: false
      readonly reason: MatchFailureReason
      readonly origin: GridCoordinate
      readonly cluster: readonly GridCoordinate[]
      readonly removedCoordinates: readonly GridCoordinate[]
      readonly removedBubbles?: readonly RemovedMatchBubble[]
    }
  | {
      readonly ok: true
      readonly matched: boolean
      readonly origin: GridCoordinate
      readonly bubble: BubbleDescriptor
      readonly color: BubbleColor
      readonly cluster: readonly GridCoordinate[]
      readonly clusterSize: number
      readonly removedCoordinates: readonly GridCoordinate[]
      readonly removedBubbles?: readonly RemovedMatchBubble[]
    }
