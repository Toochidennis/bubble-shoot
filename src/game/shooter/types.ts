import type { LogicalViewport, Point2D } from '../../types/foundation'

export type BubbleColor = 'blue' | 'green' | 'purple' | 'red' | 'yellow'

export interface BubbleDescriptor {
  readonly color: BubbleColor
  /** Optional mission metadata; it does not alter color matching or physics. */
  readonly marked?: boolean
}

export interface AimLimits {
  /** Signed radians from upward vertical: negative is left, positive is right. */
  readonly minAngleRadians: number
  readonly maxAngleRadians: number
}

export interface ShooterConfig {
  readonly viewport: LogicalViewport
  readonly bottomInset: number
  readonly aimLimits: AimLimits
  readonly currentBubble: BubbleDescriptor
  readonly nextBubble: BubbleDescriptor
}

export interface ShooterStateSnapshot {
  readonly origin: Point2D
  readonly aimAngleRadians: number
  readonly aimDirection: Point2D
  readonly currentBubble: BubbleDescriptor
  readonly nextBubble: BubbleDescriptor
  readonly inputLocked: boolean
  readonly fireRequested: boolean
}

export type FireRequestResult =
  | {
      readonly accepted: true
      readonly bubble: BubbleDescriptor
      readonly aimDirection: Point2D
    }
  | {
      readonly accepted: false
      readonly reason: 'input-locked' | 'fire-request-pending'
    }
