import { describe, expect, it } from 'vitest'
import { getMapLevelState, getQuickPlayLevel } from './progressionView'

describe('home progression view state', () => {
  it('distinguishes completed, current, unlocked, and locked levels', () => {
    const completed = { levelId: 2, completed: true, bestScore: 100, bestStars: 3, completionCount: 1 }
    expect(getMapLevelState(2, 4, completed)).toBe('completed')
    expect(getMapLevelState(4, 4, null)).toBe('current')
    expect(getMapLevelState(3, 4, null)).toBe('unlocked')
    expect(getMapLevelState(8, 4, null)).toBe('locked')
  })

  it('clamps Quick Play to a valid supported level', () => {
    expect(getQuickPlayLevel(0, 10000)).toBe(1)
    expect(getQuickPlayLevel(145, 10000)).toBe(145)
    expect(getQuickPlayLevel(10001, 10000)).toBe(10000)
    expect(getQuickPlayLevel(Number.NaN, 10000)).toBe(1)
  })
})
