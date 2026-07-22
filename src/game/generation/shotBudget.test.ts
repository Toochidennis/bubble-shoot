import { describe, expect, it } from 'vitest'

import { MAX_GENERATED_SHOTS, MIN_GENERATED_SHOTS } from './config'
import { boardClearPar, computeShotBudget, shotMargin, skilledClearRate } from './shotBudget'

describe('shot budget model', () => {
  it('clears fewer bubbles per shot with more colors, more with drop cascades', () => {
    expect(skilledClearRate(3)).toBeGreaterThan(skilledClearRate(4))
    expect(skilledClearRate(4)).toBeGreaterThan(skilledClearRate(5))
    expect(skilledClearRate(5, 6)).toBeGreaterThan(skilledClearRate(5, 0))
  })

  it('tightens the fairness margin as levels rise, but never below a winnable floor', () => {
    expect(shotMargin(1)).toBeGreaterThan(shotMargin(200))
    expect(shotMargin(200)).toBeGreaterThan(shotMargin(2_000))
    expect(shotMargin(1)).toBeLessThanOrEqual(1.55)
    expect(shotMargin(10_000)).toBeGreaterThanOrEqual(1.12)
  })

  it('always grants at least par shots (winnable) and stays within bounds', () => {
    for (const [par, level] of [[10, 1], [25, 500], [55, 9_000]] as const) {
      const shots = computeShotBudget(par, level)
      expect(shots).toBeGreaterThanOrEqual(Math.min(MAX_GENERATED_SHOTS, Math.ceil(par)))
      expect(shots).toBeGreaterThanOrEqual(MIN_GENERATED_SHOTS)
      expect(shots).toBeLessThanOrEqual(MAX_GENERATED_SHOTS)
    }
  })

  it('grants fewer shots deeper for the same board (rising difficulty)', () => {
    // A small board so the result stays under the 25-shot ceiling and the
    // level-based tightening is visible rather than clamped.
    const par = boardClearPar(28, 4)
    expect(computeShotBudget(par, 20)).toBeGreaterThan(computeShotBudget(par, 5_000))
  })
})
