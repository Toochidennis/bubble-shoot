import type { LogicalViewport, Point2D } from '../../types/foundation'

import { aimDirectionFromPointer, angleToDirection, clampAimAngle } from './aimMath'
import { getShooterOrigin } from './shooterConfig'
import type {
  AimLimits,
  BubbleDescriptor,
  FireRequestResult,
  ShooterConfig,
  ShooterStateSnapshot,
} from './types'

export class ShooterState {
  private viewport: LogicalViewport
  private readonly bottomInset: number
  private readonly aimLimits: AimLimits
  private currentBubble: BubbleDescriptor
  private nextBubble: BubbleDescriptor
  private aimAngleRadians = 0
  private inputLocked = false
  private fireRequested = false

  public constructor(config: ShooterConfig) {
    this.viewport = config.viewport
    this.bottomInset = config.bottomInset
    this.aimLimits = config.aimLimits
    this.currentBubble = config.currentBubble
    this.nextBubble = config.nextBubble
  }

  public snapshot(): ShooterStateSnapshot {
    return {
      origin: getShooterOrigin(this.viewport, this.bottomInset),
      aimAngleRadians: this.aimAngleRadians,
      aimDirection: angleToDirection(this.aimAngleRadians),
      currentBubble: this.currentBubble,
      nextBubble: this.nextBubble,
      inputLocked: this.inputLocked,
      fireRequested: this.fireRequested,
    }
  }

  public setViewport(viewport: LogicalViewport): void {
    this.viewport = viewport
  }

  public updateAimFromPointer(pointer: Point2D): boolean {
    if (!this.canAcceptAim()) {
      return false
    }

    const origin = getShooterOrigin(this.viewport, this.bottomInset)
    const result = aimDirectionFromPointer(origin, pointer, this.aimLimits)
    this.aimAngleRadians = result.angleRadians
    return true
  }

  public setAimAngle(angleRadians: number): boolean {
    if (!this.canAcceptAim()) {
      return false
    }

    this.aimAngleRadians = clampAimAngle(angleRadians, this.aimLimits)
    return true
  }

  public setInputLocked(locked: boolean): void {
    this.inputLocked = locked
  }

  public requestFire(): FireRequestResult {
    if (this.fireRequested) {
      return { accepted: false, reason: 'fire-request-pending' }
    }

    if (this.inputLocked) {
      return { accepted: false, reason: 'input-locked' }
    }

    this.fireRequested = true
    this.inputLocked = true

    return {
      accepted: true,
      bubble: this.currentBubble,
      aimDirection: angleToDirection(this.aimAngleRadians),
    }
  }

  public clearFireRequest(): void {
    this.fireRequested = false
  }

  public abortPendingFire(): void {
    this.fireRequested = false
    this.inputLocked = false
  }

  public completeTurn(nextBubble: BubbleDescriptor, advanceBubble: boolean): void {
    if (advanceBubble) {
      this.currentBubble = this.nextBubble
      this.nextBubble = nextBubble
    }
    this.aimAngleRadians = 0
    this.fireRequested = false
    this.inputLocked = false
  }

  public unlockInput(): void {
    this.inputLocked = false
  }

  private canAcceptAim(): boolean {
    return !this.inputLocked && !this.fireRequested
  }
}
