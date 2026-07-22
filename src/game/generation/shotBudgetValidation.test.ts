import { describe, expect, it } from 'vitest'

import { getLevel } from '../levels/levelCatalog'
import { solveShotsToWin } from './shotSolver'

/**
 * Offline (dev/CI only, never bundled): uses the headless solver as ground truth
 * to (1) prove that granted budgets are actually winnable for solvable missions,
 * and (2) report solver-shots vs granted-budget per mission type so the formula
 * constants can be calibrated against real self-play instead of estimates.
 */
describe('shot budget validation (solver-verified)', () => {
  it('target-mission budgets are winnable, with calibration stats', () => {
    interface Stat { count: number; solverSum: number; solverMin: number; solverMax: number; budgetSum: number; unverifiable: number }
    const stats = new Map<string, Stat>()

    for (let id = 16; id <= 85; id += 1) {
      const access = getLevel(id)
      if (!access.ok) continue
      const level = access.level
      if (level.mission.type === 'CLEAR_ALL_BUBBLES') continue

      const budget = level.shotLimit
      const free = solveShotsToWin(level, 60)
      const type = level.mission.type
      const stat = stats.get(type) ?? { count: 0, solverSum: 0, solverMin: Infinity, solverMax: 0, budgetSum: 0, unverifiable: 0 }
      stat.count += 1
      stat.budgetSum += budget

      if (free.won) {
        stat.solverSum += free.shots
        stat.solverMin = Math.min(stat.solverMin, free.shots)
        stat.solverMax = Math.max(stat.solverMax, free.shots)
        // Guard: if the solver can win a target mission at all, the granted
        // budget must let it win too (base-winnable, no ad required).
        const within = solveShotsToWin(level, budget)
        expect(within.won, `L${id} ${type}: unwinnable within budget ${budget} (solver needs ${free.shots})`).toBe(true)
      } else {
        stat.unverifiable += 1
      }
      stats.set(type, stat)
    }

    for (const [type, s] of stats) {
      const solverAvg = s.count - s.unverifiable > 0 ? (s.solverSum / (s.count - s.unverifiable)).toFixed(1) : 'n/a'
      console.info(`BUDGET_STATS ${type}: n=${s.count} solver[avg=${solverAvg} min=${Number.isFinite(s.solverMin) ? s.solverMin : '-'} max=${s.solverMax}] budgetAvg=${(s.budgetSum / s.count).toFixed(1)} solverUnverifiable=${s.unverifiable}`)
    }
    expect(stats.size).toBeGreaterThan(0)
  }, 120_000)
})
