import type { TurnResult } from '../session/types'
import { DEFAULT_SCORE_CONFIG } from './scoreConfig'
import type { ScoreConfig, TurnScoreBreakdown } from './types'

export function calculateCompletionBonus(
  shotsRemaining: number,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): number {
  if (!Number.isFinite(shotsRemaining) || shotsRemaining <= 0) return 0
  return Math.floor(shotsRemaining) * config.completionBonusPerRemainingShot
}

export function calculateTurnScore(
  turn: TurnResult,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): TurnScoreBreakdown {
  const matchedBubbleCount = turn.match?.ok === true && turn.match.matched
    ? turn.match.removedCoordinates.length
    : 0
  const floatingBubbleCount = turn.floating?.removedCount ?? 0
  const matchPoints = matchedBubbleCount * config.pointsPerMatchedBubble
  const floatingPoints = floatingBubbleCount * config.pointsPerFloatingBubble
  const largeMatchBonus = Math.max(0, matchedBubbleCount - 3) * config.largeMatchBonusPerExtraBubble
  return {
    matchedBubbleCount,
    floatingBubbleCount,
    matchPoints,
    floatingPoints,
    largeMatchBonus,
    completionBonus: 0,
    total: matchPoints + floatingPoints + largeMatchBonus,
  }
}

export function addCompletionBonus(
  breakdown: TurnScoreBreakdown,
  shotsRemaining: number,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): TurnScoreBreakdown {
  const completionBonus = calculateCompletionBonus(shotsRemaining, config)
  return { ...breakdown, completionBonus, total: breakdown.total + completionBonus }
}
