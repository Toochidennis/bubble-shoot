import type { Point2D } from '../../types/foundation'
import type { HexBoard } from '../grid/HexBoard'
import { resolveFloatingBubbles } from '../floating/floatingResolver'
import type { FloatingResolutionResult } from '../floating/types'
import { resolveMatch } from '../match/matchResolver'
import type { MatchResult } from '../match/types'
import type { ProjectileManager } from '../physics/ProjectileManager'
import type { ProjectileImpact, ProjectileState, ProjectileStepResult } from '../physics/types'
import type { ProjectileStepEnvironment } from '../physics/projectileStepper'
import { resolveSnapAndPlace } from '../snap/snapResolver'
import type { SnapResult } from '../snap/types'
import type { ShooterState } from '../shooter/ShooterState'
import type { BubbleDescriptor } from '../shooter/types'
import type {
  BubbleSource,
  FireAttempt,
  GameplayLifecycleState,
  LifecycleTransitionFailure,
  SessionSnapshot,
  SessionStepResult,
  TurnResult,
  TurnCompletionReason,
} from './types'

const ALLOWED_TRANSITIONS: Record<GameplayLifecycleState, readonly GameplayLifecycleState[]> = {
  INITIALIZING: ['AIMING'],
  AIMING: ['SHOOTING', 'PAUSED'],
  SHOOTING: ['SNAPPING', 'PAUSED', 'TURN_COMPLETE'],
  SNAPPING: ['MATCHING', 'TURN_COMPLETE', 'PAUSED'],
  MATCHING: ['RESOLVING_FLOATING', 'TURN_COMPLETE', 'PAUSED'],
  RESOLVING_FLOATING: ['TURN_COMPLETE', 'PAUSED'],
  TURN_COMPLETE: ['AIMING'],
  PAUSED: ['AIMING', 'SHOOTING', 'SNAPPING', 'MATCHING', 'RESOLVING_FLOATING', 'TURN_COMPLETE'],
}

export class GameplaySession {
  private lifecycleState: GameplayLifecycleState = 'INITIALIZING'
  private pausedState: Exclude<GameplayLifecycleState, 'INITIALIZING' | 'PAUSED'> | null = null
  private transitionHistory: GameplayLifecycleState[] = ['INITIALIZING']
  private turnNumber = 0
  private turnBubble: BubbleDescriptor | null = null
  private turnImpact: ProjectileImpact | null = null
  private turnTerminalProjectile: ProjectileState | null = null
  private turnSnap: SnapResult | null = null
  private turnMatch: MatchResult | null = null
  private turnFloating: FloatingResolutionResult | null = null
  private lastTurn: TurnResult | null = null

  public constructor(
    public readonly board: HexBoard<BubbleDescriptor>,
    public readonly shooter: ShooterState,
    public readonly projectileManager: ProjectileManager,
    private readonly bubbleSource: BubbleSource,
    private readonly shouldAdvanceBubble: () => boolean = () => true,
  ) {
    this.transition('AIMING')
  }

  public get state(): GameplayLifecycleState {
    return this.lifecycleState
  }

  public get activeProjectile() {
    return this.projectileManager.active
  }

  public get completedImpact() {
    return this.projectileManager.completedImpact
  }

  public get lastTurnResult(): TurnResult | null {
    return this.lastTurn
  }

  public get currentBubble(): BubbleDescriptor {
    return this.shooter.snapshot().currentBubble
  }

  public get nextBubble(): BubbleDescriptor {
    return this.shooter.snapshot().nextBubble
  }

  public snapshot(): SessionSnapshot {
    return {
      state: this.lifecycleState,
      turnNumber: this.turnNumber,
      currentBubble: this.currentBubble,
      nextBubble: this.nextBubble,
      canAim: this.lifecycleState === 'AIMING',
      canFire: this.lifecycleState === 'AIMING',
      activeProjectile: this.projectileManager.active !== null,
      lastTurn: this.lastTurn,
      transitionHistory: [...this.transitionHistory],
    }
  }

  public updateAim(pointer: Point2D): boolean {
    if (this.lifecycleState !== 'AIMING') {
      return false
    }
    return this.shooter.updateAimFromPointer(pointer)
  }

  public requestFire(origin: Point2D): FireAttempt {
    if (this.lifecycleState !== 'AIMING') {
      return { accepted: false, reason: 'not-aiming' }
    }
    const fireRequest = this.shooter.requestFire()
    if (!fireRequest.accepted) {
      return { accepted: false, reason: fireRequest.reason === 'input-locked' ? 'input-locked' : 'projectile-rejected' }
    }
    const spawn = this.projectileManager.spawnFromFire(fireRequest, origin)
    if (!spawn.accepted) {
      this.shooter.abortPendingFire()
      return { accepted: false, reason: 'projectile-rejected' }
    }
    this.turnNumber += 1
    this.turnBubble = fireRequest.bubble
    this.turnImpact = null
    this.turnTerminalProjectile = null
    this.turnSnap = null
    this.turnMatch = null
    this.turnFloating = null
    this.transition('SHOOTING')
    return { accepted: true, projectileId: spawn.projectile.id, bubble: fireRequest.bubble }
  }

  public step(elapsedSeconds: number, environment: ProjectileStepEnvironment): SessionStepResult | null {
    if (this.lifecycleState !== 'SHOOTING') {
      return null
    }
    const projectileStep = this.projectileManager.step(elapsedSeconds, environment)
    if (projectileStep === null) {
      this.abortTurn('projectile-missing')
      return null
    }
    if (projectileStep.impact !== null) {
      const turn = this.resolveTerminalImpact(projectileStep)
      return { projectileStep, turn }
    }
    return { projectileStep, turn: null }
  }

  public pause(): { ok: true } | { ok: false; reason: LifecycleTransitionFailure } {
    if (this.lifecycleState === 'PAUSED' || this.lifecycleState === 'INITIALIZING' || this.lifecycleState === 'TURN_COMPLETE') {
      return { ok: false, reason: 'unsupported-pause' }
    }
    this.pausedState = this.lifecycleState
    this.transition('PAUSED')
    return { ok: true }
  }

  public resume(): { ok: true; state: GameplayLifecycleState } | { ok: false; reason: LifecycleTransitionFailure } {
    if (this.lifecycleState !== 'PAUSED' || this.pausedState === null) {
      return { ok: false, reason: 'not-paused' }
    }
    const state = this.pausedState
    this.pausedState = null
    this.transition(state)
    return { ok: true, state }
  }

  public transition(nextState: GameplayLifecycleState): { ok: true } | { ok: false; reason: LifecycleTransitionFailure } {
    if (!ALLOWED_TRANSITIONS[this.lifecycleState].includes(nextState)) {
      return { ok: false, reason: 'invalid-transition' }
    }
    this.lifecycleState = nextState
    this.transitionHistory.push(nextState)
    return { ok: true }
  }

  private resolveTerminalImpact(projectileStep: ProjectileStepResult): TurnResult {
    const impact = projectileStep.impact
    if (impact === null) {
      return this.abortTurn('projectile-missing')
    }
    this.turnImpact = impact
    this.turnTerminalProjectile = projectileStep.projectile
    this.transition('SNAPPING')
    if (impact.type === 'safety-limit') {
      return this.abortTurn('safety-limit')
    }

    this.turnSnap = resolveSnapAndPlace(this.board, projectileStep.projectile.bubble, impact)
    if (!this.turnSnap.ok) {
      return this.abortTurn('snap-failure')
    }

    this.transition('MATCHING')
    this.turnMatch = resolveMatch(this.board, this.turnSnap.coordinate)
    if (!this.turnMatch.ok) {
      return this.abortTurn('snap-failure')
    }
    if (this.turnMatch.matched) {
      this.transition('RESOLVING_FLOATING')
      this.turnFloating = resolveFloatingBubbles(this.board)
    }
    return this.completeTurn('completed')
  }

  private completeTurn(reason: TurnCompletionReason): TurnResult {
    if (this.lifecycleState !== 'TURN_COMPLETE') {
      this.transition('TURN_COMPLETE')
    }
    const result: TurnResult = {
      turnNumber: this.turnNumber,
      startingState: 'AIMING',
      finalState: 'AIMING',
      firedBubble: this.turnBubble ?? this.currentBubble,
      impact: this.turnImpact,
      terminalProjectile: this.turnSnap?.ok === false ? this.turnTerminalProjectile : null,
      snap: this.turnSnap,
      match: this.turnMatch,
      floating: this.turnFloating,
      completed: reason === 'completed',
      reason,
    }
    this.lastTurn = result
    this.projectileManager.clearCompletedImpact()
    const advanceBubble = reason === 'completed' && this.shouldAdvanceBubble()
    const nextBubble = advanceBubble ? this.bubbleSource.next() : this.nextBubble
    this.shooter.completeTurn(nextBubble, advanceBubble)
    this.transition('AIMING')
    return result
  }

  private abortTurn(reason: TurnCompletionReason): TurnResult {
    if (this.lifecycleState !== 'TURN_COMPLETE') {
      this.transition('TURN_COMPLETE')
    }
    return this.completeTurn(reason)
  }
}
