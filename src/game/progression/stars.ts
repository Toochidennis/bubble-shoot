import type { StarThresholds } from '../levels/types'

export function calculateStars(finalScore: number, thresholds: StarThresholds, completed: boolean): number {
  if (!completed) return 0
  if (finalScore >= thresholds.three) return 3
  if (finalScore >= thresholds.two) return 2
  return 1
}
