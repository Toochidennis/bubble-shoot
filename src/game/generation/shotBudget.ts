import { MAX_GENERATED_SHOTS, MIN_GENERATED_SHOTS } from './config'
import type { GeneratedDifficulty } from './types'

/**
 * Shot-budget model. Instead of hand-picking shot counts (which drifted generous
 * and even inverted the difficulty ramp), the budget is derived from how many
 * shots a *skilled* player needs — "par" — times a fairness margin that starts
 * forgiving and tightens as levels rise. Net effect: tight but always winnable
 * with clean play, and monotonically harder with level.
 */

/**
 * Bubbles a skilled player clears per shot. Fewer with more colors (harder to
 * form matches); a little more when the board has good support-drop cascades.
 * These constants are the main thing to CALIBRATE from real "shots-to-win" data.
 */
export function skilledClearRate(paletteSize: number, dropOpportunity = 0): number {
  const base = 2.8 - 0.3 * Math.max(0, paletteSize - 3) // 3→2.8, 4→2.5, 5→2.2
  const dropBonus = Math.min(0.35, Math.max(0, dropOpportunity) * 0.05)
  return Math.max(1.8, base + dropBonus)
}

/** Difficulty-band texture layered on the level trend (breather vs. spike). */
const BAND_FACTOR: Record<GeneratedDifficulty, number> = {
  recovery: 1.12,
  easy: 1.06,
  medium: 1,
  hard: 0.95,
  challenge: 0.9,
}

/**
 * Fairness margin over par: ~1.50 at level 1, decaying toward ~1.12 deep, with a
 * difficulty-band multiplier. Floored at 1.12 so every level keeps enough slack
 * to win with clean play; capped at 1.55 so breathers never balloon.
 */
export function shotMargin(levelId: number, band: GeneratedDifficulty = 'medium'): number {
  const base = 1.12 + 0.38 * Math.exp(-(Math.max(1, levelId) - 1) / 160)
  return Math.min(1.55, Math.max(1.12, base * BAND_FACTOR[band]))
}

/**
 * Shots granted for a level = par (skilled shots needed) × fairness margin,
 * clamped to the generated bounds. `parShots` is already in shots.
 */
export function computeShotBudget(parShots: number, levelId: number, band: GeneratedDifficulty = 'medium'): number {
  const budget = Math.ceil(Math.max(1, parShots) * shotMargin(levelId, band))
  return Math.max(MIN_GENERATED_SHOTS, Math.min(MAX_GENERATED_SHOTS, budget))
}

/** Par shots to clear a whole board of `bubbleCount` bubbles at the skilled rate. */
export function boardClearPar(bubbleCount: number, paletteSize: number, dropOpportunity = 0): number {
  return bubbleCount / skilledClearRate(paletteSize, dropOpportunity)
}
