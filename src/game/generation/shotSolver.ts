import { HexBoard } from '../grid/HexBoard'
import type { HexGridConfig } from '../grid/gridConfig'
import { createGameplayLayout } from '../layout/gameplayLayout'
import { LevelBubbleSource } from '../levels/levelBubbleSource'
import type { CuratedBubblePlacement } from '../levels/types'
import { createMissionRuntime } from '../mission/missionRuntime'
import type { MissionConfiguration } from '../mission/types'
import { getOccupiedBubbleColliders } from '../physics/collisionQueries'
import { createProjectile, stepProjectile } from '../physics/projectileStepper'
import type { ProjectileConfig, ProjectileImpact } from '../physics/types'
import type { Point2D } from '../../types/foundation'
import { resolveSnapAndPlace } from '../snap/snapResolver'
import { resolveMatch } from '../match/matchResolver'
import { resolveFloatingBubbles } from '../floating/floatingResolver'
import { angleToDirection, DEFAULT_AIM_LIMITS } from '../shooter/aimMath'
import { getShooterOrigin } from '../shooter/shooterConfig'
import type { BubbleColor, BubbleDescriptor } from '../shooter/types'
import { calculateTurnScore } from '../scoring/scoring'
import type { TurnResult } from '../session/types'
import type { MatchResult } from '../match/types'
import type { FloatingResolutionResult } from '../floating/types'
import type { SnapResult } from '../snap/types'

/** Fixed reference geometry — shots-to-win is a board/mission property, not a screen size. */
const SOLVER_VIEWPORT = { width: 320, height: 560, pixelRatio: 1 } as const
const CANDIDATE_COUNT = 31
const MAX_STEP_ITERATIONS = 600
const BARREN_LIMIT = 12

export interface SolvableLevel {
  readonly id: number
  readonly allowedColors: readonly BubbleColor[]
  readonly startingBubbles: readonly CuratedBubblePlacement[]
  readonly mission: MissionConfiguration
}

export interface ShotSolveResult {
  readonly won: boolean
  readonly shots: number
}

interface ShotOutcome {
  readonly placed: boolean
  readonly impact: ProjectileImpact | null
  readonly snap: SnapResult | null
  readonly match: MatchResult | null
  readonly floating: FloatingResolutionResult | null
}

function candidateAngles(count: number): number[] {
  const { minAngleRadians, maxAngleRadians } = DEFAULT_AIM_LIMITS
  const angles: number[] = []
  for (let index = 0; index < count; index += 1) {
    angles.push(minAngleRadians + ((maxAngleRadians - minAngleRadians) * index) / (count - 1))
  }
  return angles
}

function buildBoard(level: SolvableLevel, grid: HexGridConfig): HexBoard<BubbleDescriptor> {
  const board = new HexBoard<BubbleDescriptor>(grid)
  for (const placement of level.startingBubbles) {
    board.place(placement.coordinate, placement.marked === true ? { color: placement.color, marked: true } : { color: placement.color })
  }
  return board
}

function simulateShot(
  board: HexBoard<BubbleDescriptor>,
  angle: number,
  bubble: BubbleDescriptor,
  origin: Point2D,
  bounds: { leftWallX: number; rightWallX: number; topY: number },
  config: ProjectileConfig,
): ShotOutcome {
  const environment = { bounds, bubbles: getOccupiedBubbleColliders(board, config.radius) }
  let projectile = createProjectile({ id: 'solve', bubble, origin, direction: angleToDirection(angle), config })
  let impact: ProjectileImpact | null = null
  for (let iteration = 0; iteration < MAX_STEP_ITERATIONS; iteration += 1) {
    const result = stepProjectile(projectile, config.maxDeltaSeconds, environment, config)
    projectile = result.projectile
    if (result.impact !== null) { impact = result.impact; break }
    if (projectile.status === 'completed') break
  }
  if (impact === null) return { placed: false, impact: null, snap: null, match: null, floating: null }
  const snap = resolveSnapAndPlace(board, bubble, impact)
  if (!snap.ok) return { placed: false, impact, snap, match: null, floating: null }
  const match = resolveMatch(board, snap.coordinate)
  const floating = match.matched ? resolveFloatingBubbles(board) : null
  return { placed: true, impact, snap, match, floating }
}

function removedTotal(outcome: ShotOutcome): number {
  const matched = outcome.match?.matched === true ? outcome.match.removedCoordinates.length : 0
  return matched + (outcome.floating?.removedCount ?? 0)
}

function scoreOutcome(outcome: ShotOutcome, mission: MissionConfiguration, targetColor: BubbleColor | null): number {
  if (!outcome.placed) return -5
  const matchedRemoved = outcome.match?.removedBubbles ?? []
  const droppedRemoved = outcome.floating?.removedBubbles ?? []
  const total = matchedRemoved.length + droppedRemoved.length
  switch (mission.type) {
    case 'POP_COLOR': {
      const popped = [...matchedRemoved, ...droppedRemoved].filter((entry) => entry.bubble.color === targetColor).length
      return popped * 3 + total * 0.1
    }
    case 'DROP_BUBBLES':
      return (outcome.floating?.removedCount ?? 0) * 3 + total * 0.1
    case 'CLEAR_MARKED': {
      const marked = [...matchedRemoved, ...droppedRemoved].filter((entry) => entry.bubble.marked === true).length
      return marked * 5 + total * 0.1
    }
    default:
      // CLEAR_ALL, REACH_SCORE, and MISSION_SET all progress fastest by clearing the most bubbles.
      return total
  }
}

function toTurn(outcome: ShotOutcome, turnNumber: number, bubble: BubbleDescriptor): TurnResult {
  return {
    turnNumber,
    startingState: 'AIMING',
    finalState: 'AIMING',
    firedBubble: bubble,
    impact: outcome.impact,
    terminalProjectile: null,
    snap: outcome.snap,
    match: outcome.match,
    floating: outcome.floating,
    completed: true,
    reason: 'completed',
  }
}

/**
 * Greedy headless self-play. Reuses the real projectile / snap / match / floating
 * engine to estimate how many shots a competent player needs to satisfy the
 * mission, giving up once it clearly passes `maxShots` (or stalls on an
 * unclearable endgame). Deterministic per level.
 */
export function solveShotsToWin(level: SolvableLevel, maxShots: number): ShotSolveResult {
  const layout = createGameplayLayout(SOLVER_VIEWPORT)
  const config = layout.projectile
  const origin = getShooterOrigin(SOLVER_VIEWPORT, layout.shooterBottomInset)
  const bounds = { leftWallX: 0, rightWallX: SOLVER_VIEWPORT.width, topY: layout.boardCeilingY }
  const angles = candidateAngles(CANDIDATE_COUNT)
  const targetColor = level.mission.type === 'POP_COLOR' ? level.mission.targetColor : null

  const board = buildBoard(level, layout.grid)
  const source = new LevelBubbleSource(level, board)
  const mission = createMissionRuntime(level.mission, board, board.size)

  let current = source.next()
  let score = 0
  let shots = 0
  let barren = 0

  while (shots < maxShots && !mission.progress.completed) {
    let bestAngle = angles[0] ?? 0
    let bestScore = -Infinity
    for (const angle of angles) {
      const outcome = simulateShot(board.clone(), angle, current, origin, bounds, config)
      const value = scoreOutcome(outcome, level.mission, targetColor)
      if (value > bestScore) { bestScore = value; bestAngle = angle }
    }

    const committed = simulateShot(board, bestAngle, current, origin, bounds, config)
    shots += 1
    barren = removedTotal(committed) > 0 ? 0 : barren + 1
    if (committed.placed) {
      const turn = toTurn(committed, shots, current)
      score += calculateTurnScore(turn).total
      mission.update({ id: `solve:${shots}`, turn, board, currentScore: score })
    }
    current = source.next()
    if (barren >= BARREN_LIMIT) break
  }

  return { won: mission.progress.completed, shots }
}
