import type { ScoreConfig } from './types'

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  pointsPerMatchedBubble: 10,
  pointsPerFloatingBubble: 20,
  largeMatchBonusPerExtraBubble: 5,
  completionBonusPerRemainingShot: 25,
}
