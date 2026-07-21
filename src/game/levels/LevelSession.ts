import type { LogicalViewport, Point2D } from '../../types/foundation'
import { HexBoard } from '../grid/HexBoard'
import { createMissionRuntime, MissionRuntime } from '../mission/missionRuntime'
import { calculateStars } from '../progression/stars'
import { ProgressionRepository, createDefaultProgressionRepository } from '../progression/ProgressionRepository'
import { addCompletionBonus, calculateTurnScore } from '../scoring/scoring'
import type { TurnScoreBreakdown } from '../scoring/types'
import type { ProjectileStepEnvironment } from '../physics/projectileStepper'
import { ProjectileManager } from '../physics/ProjectileManager'
import { createDefaultShooterConfig } from '../shooter/shooterConfig'
import { ShooterState } from '../shooter/ShooterState'
import type { BubbleDescriptor } from '../shooter/types'
import { GameplaySession } from '../session/GameplaySession'
import type { SessionSnapshot, SessionStepResult } from '../session/types'
import { getLevel } from './levelCatalog'
import { LevelBubbleSource } from './levelBubbleSource'
import { evaluateLevelStatus } from './types'
import type { LevelLoadFailure, LevelStatus, NormalizedLevelDefinition, StarThresholds } from './types'
import type { MissionSetProgress } from '../mission/types'
import { createGameplayLayout, type GameplayLayout } from '../layout/gameplayLayout'
import { detectEmptyBoardMissionInvariant, type EmptyBoardMissionInvariantDiagnostic } from './levelInvariant'

export interface LevelSessionSnapshot {
  readonly levelId: number
  readonly displayNumber: number
  readonly status: LevelStatus
  readonly shotLimit: number
  readonly starThresholds: StarThresholds
  readonly shotsUsed: number
  readonly shotsRemaining: number
  readonly mission: MissionSetProgress
  readonly currentRunScore: number
  readonly lastTurnScore: TurnScoreBreakdown | null
  readonly finalScore: number | null
  readonly earnedStars: number
  readonly bestScore: number
  readonly bestStars: number
  readonly highestUnlockedLevel: number
  readonly levelUnlocked: boolean
  readonly contentInvariant: EmptyBoardMissionInvariantDiagnostic | null
  readonly gameplay: SessionSnapshot
}

export class LevelSession {
  private level: NormalizedLevelDefinition
  private levelStatus: LevelStatus = 'ACTIVE'
  private shotsUsed = 0
  private missionProgress: MissionSetProgress
  private missionRuntime: MissionRuntime
  private currentRunScore = 0
  private lastTurnScore: TurnScoreBreakdown | null = null
  private finalScore: number | null = null
  private earnedStars = 0
  private processedTurnNumber = 0
  private contentInvariant: EmptyBoardMissionInvariantDiagnostic | null = null
  public gameplay: GameplaySession
  public readonly progression: ProgressionRepository
  private layout: GameplayLayout

  public constructor(
    levelId = 1,
    private readonly viewport: LogicalViewport = { width: 320, height: 560, pixelRatio: 1 },
    progression: ProgressionRepository = createDefaultProgressionRepository(),
    layout?: GameplayLayout,
  ) {
    this.progression = progression
    // Every session, including direct engine/test construction, receives the
    // same HUD-safe responsive layout used by CanvasHost. This prevents the
    // former row-zero-under-HUD regression from returning through a fallback.
    this.layout = layout ?? createGameplayLayout(this.viewport)
    if (!progression.isLevelUnlocked(levelId)) throw new RangeError(`Level ${levelId} is locked.`)
    const access = getLevel(levelId)
    if (!access.ok) throw new RangeError(`Unable to load level ${levelId}: ${access.reason}.`)
    this.level = access.level
    const created = this.createGameplay(this.level)
    this.gameplay = created.gameplay
    this.missionRuntime = createMissionRuntime(this.level.mission, this.gameplay.board, this.level.startingBubbles.length)
    this.missionProgress = this.missionRuntime.progress
  }

  public get activeLevel(): NormalizedLevelDefinition {
    return this.level
  }

  public get status(): LevelStatus {
    return this.levelStatus
  }

  public get mission(): MissionSetProgress {
    return this.missionProgress
  }

  public get shotsRemaining(): number {
    return Math.max(0, this.level.shotLimit - this.shotsUsed)
  }

  public get shotsUsedCount(): number {
    return this.shotsUsed
  }

  public snapshot(): LevelSessionSnapshot {
    return {
      levelId: this.level.id,
      displayNumber: this.level.displayNumber,
      status: this.levelStatus,
      shotLimit: this.level.shotLimit,
      starThresholds: this.level.starThresholds,
      shotsUsed: this.shotsUsed,
      shotsRemaining: this.shotsRemaining,
      mission: this.missionProgress,
      currentRunScore: this.currentRunScore,
      lastTurnScore: this.lastTurnScore,
      finalScore: this.finalScore,
      earnedStars: this.earnedStars,
      bestScore: this.progression.getRecord(this.level.id)?.bestScore ?? 0,
      bestStars: this.progression.getRecord(this.level.id)?.bestStars ?? 0,
      highestUnlockedLevel: this.progression.highestUnlockedLevel,
      levelUnlocked: this.progression.isLevelUnlocked(this.level.id),
      contentInvariant: this.contentInvariant,
      gameplay: this.gameplay.snapshot(),
    }
  }

  /**
   * Re-centres the board to the actual canvas size and adopts that layout for
   * subsequent levels too. CanvasHost calls this on mount/resize so the board
   * tracks the real viewport width the same way the shooter does, rather than
   * the width guessed before the canvas was measured.
   */
  public applyViewport(viewport: LogicalViewport): GameplayLayout {
    this.layout = createGameplayLayout(viewport)
    this.gameplay.board.relayout(this.layout.grid)
    return this.layout
  }

  public updateAim(pointer: Point2D): boolean {
    return this.levelStatus === 'ACTIVE' && this.gameplay.updateAim(pointer)
  }

  public requestFire(origin: Point2D): { accepted: true } | { accepted: false; reason: 'level-not-active' | 'not-aiming' | 'input-locked' | 'projectile-rejected' } {
    if (this.levelStatus !== 'ACTIVE') return { accepted: false, reason: 'level-not-active' }
    const result = this.gameplay.requestFire(origin)
    if (!result.accepted) return { accepted: false, reason: result.reason }
    this.shotsUsed += 1
    return { accepted: true }
  }

  public step(elapsedSeconds: number, environment: ProjectileStepEnvironment): SessionStepResult | null {
    if (this.levelStatus !== 'ACTIVE') return null
    const result = this.gameplay.step(elapsedSeconds, environment)
    if (result?.turn !== null && result?.turn !== undefined) {
      this.applyTurnResult(result.turn)
    }
    return result
  }

  public pause() {
    return this.gameplay.pause()
  }

  public resume() {
    return this.gameplay.resume()
  }

  public loadLevel(levelId: number): { ok: true } | { ok: false; reason: LevelLoadFailure } {
    const access = getLevel(levelId)
    if (!access.ok) return { ok: false, reason: access.reason === 'invalid-level' ? 'invalid-level' : access.reason === 'generation-failed' ? 'generation-failed' : 'level-not-found' }
    const nextLevel = access.level
    if (!this.progression.isLevelUnlocked(levelId)) return { ok: false, reason: 'level-locked' }
    return this.replaceLevel(nextLevel)
  }

  public loadDevelopmentLevel(levelId: number): { ok: true } | { ok: false; reason: LevelLoadFailure } {
    const access = getLevel(levelId)
    if (!access.ok) return { ok: false, reason: access.reason === 'invalid-level' ? 'invalid-level' : access.reason === 'generation-failed' ? 'generation-failed' : 'level-not-found' }
    const nextLevel = access.level
    return this.replaceLevel(nextLevel)
  }

  private replaceLevel(nextLevel: NormalizedLevelDefinition): { ok: true } {
    this.level = nextLevel
    const created = this.createGameplay(nextLevel)
    this.gameplay = created.gameplay
    this.levelStatus = 'ACTIVE'
    this.shotsUsed = 0
    this.missionRuntime = createMissionRuntime(nextLevel.mission, this.gameplay.board, nextLevel.startingBubbles.length)
    this.missionProgress = this.missionRuntime.progress
    this.currentRunScore = 0
    this.lastTurnScore = null
    this.finalScore = null
    this.earnedStars = 0
    this.processedTurnNumber = 0
    this.contentInvariant = null
    return { ok: true }
  }

  public restart(): void {
    this.loadDevelopmentLevel(this.level.id)
  }

  private applyTurnResult(turn: import('../session/types').TurnResult): void {
    if (turn.turnNumber <= this.processedTurnNumber) return
    this.processedTurnNumber = turn.turnNumber
    let breakdown = calculateTurnScore(turn)
    const provisionalScore = this.currentRunScore + breakdown.total
    this.missionProgress = this.missionRuntime.update({ id: `turn:${turn.turnNumber}`, turn, board: this.gameplay.board, currentScore: provisionalScore })
    this.contentInvariant = detectEmptyBoardMissionInvariant({
      contentSource: this.level.contentSource,
      boardSize: this.gameplay.board.size,
      levelId: this.level.id,
      missionDefinition: this.level.mission,
      missionProgress: this.missionProgress,
      startingBubbleCount: this.level.startingBubbles.length,
      processedTurnNumber: turn.turnNumber,
    })
    this.levelStatus = this.contentInvariant === null
      ? evaluateLevelStatus(this.missionProgress, this.shotsRemaining)
      : 'LOST'
    if (this.levelStatus === 'WON') {
      breakdown = addCompletionBonus(breakdown, this.shotsRemaining)
      this.finalScore = this.currentRunScore + breakdown.total
      this.earnedStars = calculateStars(this.finalScore, this.getStarThresholds(), true)
      this.progression.recordCompletion(this.level.id, this.finalScore, this.earnedStars)
    } else if (this.levelStatus === 'LOST') {
      this.finalScore = null
      this.earnedStars = 0
    }
    this.currentRunScore += breakdown.total
    this.lastTurnScore = breakdown
  }

  private getStarThresholds(): StarThresholds {
    return this.level.starThresholds
  }

  private createGameplay(level: Pick<NormalizedLevelDefinition, 'id' | 'startingBubbles' | 'allowedColors'>): { gameplay: GameplaySession; source: LevelBubbleSource } {
    const board = new HexBoard<BubbleDescriptor>(this.layout.grid)
    for (const placement of level.startingBubbles) {
      board.place(placement.coordinate, placement.marked === true ? { color: placement.color, marked: true } : { color: placement.color })
    }
    const source = new LevelBubbleSource(level, board)
    const currentBubble = source.next()
    const nextBubble = source.next()
    const shooter = new ShooterState({
      ...createDefaultShooterConfig(this.viewport),
      bottomInset: this.layout.shooterBottomInset,
      currentBubble,
      nextBubble,
    })
    return {
      gameplay: new GameplaySession(
        board,
        shooter,
        new ProjectileManager(this.layout.projectile),
        source,
        () => board.size > 0,
      ),
      source,
    }
  }
}
