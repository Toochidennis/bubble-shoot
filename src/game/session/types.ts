import type { GridCoordinate } from '../grid/types'
import type { FloatingResolutionResult } from '../floating/types'
import type { MatchResult } from '../match/types'
import type { ProjectileImpact, ProjectileState } from '../physics/types'
import type { SnapResult } from '../snap/types'
import type { BubbleDescriptor } from '../shooter/types'

export type GameplayLifecycleState =
  | 'INITIALIZING'
  | 'AIMING'
  | 'SHOOTING'
  | 'SNAPPING'
  | 'MATCHING'
  | 'RESOLVING_FLOATING'
  | 'TURN_COMPLETE'
  | 'PAUSED'

export type LifecycleTransitionFailure = 'invalid-transition' | 'unsupported-pause' | 'not-paused'

export type TurnCompletionReason = 'completed' | 'snap-failure' | 'unsupported-impact' | 'safety-limit' | 'projectile-missing'

export interface TurnResult {
  readonly turnNumber: number
  readonly startingState: GameplayLifecycleState
  readonly finalState: GameplayLifecycleState
  readonly firedBubble: BubbleDescriptor
  readonly impact: ProjectileImpact | null
  /**
   * The terminal projectile is retained only when the shot could not be
   * placed into a legal snap cell. It is presentation data, not board
   * occupancy and not a second active projectile.
   */
  readonly terminalProjectile: ProjectileState | null
  readonly snap: SnapResult | null
  readonly match: MatchResult | null
  readonly floating: FloatingResolutionResult | null
  readonly completed: boolean
  readonly reason: TurnCompletionReason
}

export interface SessionSnapshot {
  readonly state: GameplayLifecycleState
  readonly turnNumber: number
  readonly currentBubble: BubbleDescriptor
  readonly nextBubble: BubbleDescriptor
  readonly canAim: boolean
  readonly canFire: boolean
  readonly activeProjectile: boolean
  readonly lastTurn: TurnResult | null
  readonly transitionHistory: readonly GameplayLifecycleState[]
}

export type FireAttempt =
  | { readonly accepted: true; readonly projectileId: string; readonly bubble: BubbleDescriptor }
  | { readonly accepted: false; readonly reason: 'not-aiming' | 'input-locked' | 'projectile-rejected' }

export interface SessionStepResult {
  readonly projectileStep: import('../physics/types').ProjectileStepResult
  readonly turn: TurnResult | null
}

export interface BubbleSource {
  next(): BubbleDescriptor
}

export type { GridCoordinate }
