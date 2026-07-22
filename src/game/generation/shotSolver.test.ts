import { describe, expect, it } from 'vitest'

import { getLevel } from '../levels/levelCatalog'
import { solveShotsToWin } from './shotSolver'

describe('shot solver (headless self-play)', () => {
  it('wins generated target-mission levels in a tight, deterministic shot count', () => {
    // Ids chosen across pop / clear-marked / reach mission modes.
    for (const id of [17, 18, 19, 20]) {
      const access = getLevel(id)
      expect(access.ok).toBe(true)
      if (!access.ok) continue
      const result = solveShotsToWin(access.level, 60)
      expect(result.won).toBe(true)
      expect(result.shots).toBeGreaterThan(0)
      expect(result.shots).toBeLessThanOrEqual(40)
    }
  })

  it('is deterministic', () => {
    const access = getLevel(18)
    if (!access.ok) throw new Error('level 18 unavailable')
    expect(solveShotsToWin(access.level, 60)).toEqual(solveShotsToWin(access.level, 60))
  })

  // NOTE: a greedy bot cannot fully clear large CLEAR_ALL boards (that needs
  // multi-step planning), so CLEAR_ALL shot budgets fall back to the analytical
  // par×margin model rather than the solver. Verified empirically, not asserted here.
})
