import { describe, expect, it } from 'vitest'
import type { TurnResult } from '../session/types'
import { addCompletionBonus, calculateCompletionBonus, calculateTurnScore } from './scoring'

function turn(overrides: Partial<TurnResult> = {}): TurnResult {
  return {
    turnNumber: 1,
    startingState: 'AIMING',
    finalState: 'AIMING',
    firedBubble: { color: 'blue' },
    impact: null,
    terminalProjectile: null,
    snap: null,
    match: null,
    floating: null,
    completed: true,
    reason: 'completed',
    ...overrides,
  }
}

describe('authoritative score calculation', () => {
  it('scores an exact three-bubble match', () => {
    const result = calculateTurnScore(turn({ match: { ok: true, matched: true, origin: { row: 0, column: 0 }, bubble: { color: 'blue' }, color: 'blue', cluster: [], clusterSize: 3, removedCoordinates: [{ row: 0, column: 0 }, { row: 0, column: 1 }, { row: 0, column: 2 }] } }))
    expect(result.total).toBe(30)
    expect(result.largeMatchBonus).toBe(0)
  })

  it('adds a modest bonus for matches larger than three', () => {
    const coordinates = [0, 1, 2, 3, 4].map((column) => ({ row: 0, column }))
    const result = calculateTurnScore(turn({ match: { ok: true, matched: true, origin: coordinates[0]!, bubble: { color: 'blue' }, color: 'blue', cluster: coordinates, clusterSize: 5, removedCoordinates: coordinates } }))
    expect(result.matchPoints).toBe(50)
    expect(result.largeMatchBonus).toBe(10)
    expect(result.total).toBe(60)
  })

  it('scores floating bubbles and combined authoritative events once', () => {
    const result = calculateTurnScore(turn({
      match: { ok: true, matched: true, origin: { row: 0, column: 0 }, bubble: { color: 'blue' }, color: 'blue', cluster: [], clusterSize: 3, removedCoordinates: [{ row: 0, column: 0 }, { row: 0, column: 1 }, { row: 0, column: 2 }] },
      floating: { ok: true, supportedCoordinates: [], floatingCoordinates: [], removedBubbles: [], removalFailures: [], supportedCount: 0, floatingCount: 2, removedCount: 2, removedAny: true },
    }))
    expect(result.total).toBe(70)
    expect(calculateTurnScore(turn({ match: null, floating: null })).total).toBe(0)
    expect(calculateTurnScore(turn({ match: null, floating: null })).total).toBe(0)
  })

  it('applies completion bonus only through explicit completion handling', () => {
    expect(calculateCompletionBonus(4)).toBe(100)
    expect(calculateCompletionBonus(0)).toBe(0)
    const base = calculateTurnScore(turn())
    expect(addCompletionBonus(base, 4).total).toBe(100)
    expect(addCompletionBonus(addCompletionBonus(base, 4), 4).total).toBe(200)
  })
})
