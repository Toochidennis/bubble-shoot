import { describe, expect, it } from 'vitest'

import { getOccupiedBubbleColliders } from '../physics/collisionQueries'
import { DEFAULT_PROJECTILE_CONFIG } from '../physics/physicsConfig'
import { ProgressionRepository } from '../progression/ProgressionRepository'
import type { ProgressStorage } from '../progression/storage'
import { LevelSession } from './LevelSession'

class MemoryStorage implements ProgressStorage {
  public value: string | null = null
  public read(): string | null { return this.value }
  public write(value: string): void { this.value = value }
}

describe('level score lifecycle', () => {
  it('accumulates authoritative turn score, awards completion once, and resets replay score without losing bests', () => {
    const repository = new ProgressionRepository(new MemoryStorage())
    const session = new LevelSession(1, { width: 224, height: 560, pixelRatio: 1 }, repository)
    for (const cell of session.gameplay.board.getOccupiedCells()) session.gameplay.board.remove(cell.coordinate)
    session.gameplay.board.place({ row: 0, column: 3 }, { color: 'blue' })
    session.gameplay.board.place({ row: 0, column: 4 }, { color: 'blue' })

    const origin = session.gameplay.shooter.snapshot().origin
    expect(session.requestFire(origin).accepted).toBe(true)
    for (let index = 0; index < 40 && session.status === 'ACTIVE'; index += 1) {
      session.step(0.25, {
        bounds: { leftWallX: 0, rightWallX: 224, topY: 0 },
        bubbles: getOccupiedBubbleColliders(session.gameplay.board, DEFAULT_PROJECTILE_CONFIG.radius),
      })
    }

    expect(session.status).toBe('WON')
    expect(session.snapshot().lastTurnScore?.matchedBubbleCount).toBe(3)
    // Level 1's derived budget (par × margin, under the 34 ceiling) is 32 shots,
    // so one shot to win leaves 31 remaining → completion bonus 31 × 25 = 775.
    expect(session.snapshot().lastTurnScore?.completionBonus).toBe(775)
    expect(session.snapshot().currentRunScore).toBe(805)
    expect(session.snapshot().finalScore).toBe(805)
    expect(session.snapshot().earnedStars).toBeGreaterThanOrEqual(1)
    expect(repository.getRecord(1)).toMatchObject({ completed: true, bestScore: 805 })

    session.restart()
    expect(session.snapshot().currentRunScore).toBe(0)
    expect(session.snapshot().finalScore).toBeNull()
    expect(repository.getRecord(1)?.bestScore).toBe(805)
  })
})
