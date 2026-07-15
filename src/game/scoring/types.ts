import type { TurnResult } from '../session/types'

export interface ScoreConfig {
  readonly pointsPerMatchedBubble: number
  readonly pointsPerFloatingBubble: number
  readonly largeMatchBonusPerExtraBubble: number
  readonly completionBonusPerRemainingShot: number
}

export interface TurnScoreBreakdown {
  readonly matchedBubbleCount: number
  readonly floatingBubbleCount: number
  readonly matchPoints: number
  readonly floatingPoints: number
  readonly largeMatchBonus: number
  readonly completionBonus: number
  readonly total: number
}

export function emptyTurnScore(): TurnScoreBreakdown {
  return {
    matchedBubbleCount: 0,
    floatingBubbleCount: 0,
    matchPoints: 0,
    floatingPoints: 0,
    largeMatchBonus: 0,
    completionBonus: 0,
    total: 0,
  }
}

export type AuthoritativeTurnResult = TurnResult
