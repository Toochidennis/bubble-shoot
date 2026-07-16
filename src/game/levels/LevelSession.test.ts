import { describe, expect, it } from 'vitest'

import { LevelSession } from './LevelSession'

describe('curated level session', () => {
  it('loads level 1 with active mission, reset shots, and level-aware bubbles', () => {
    const session = new LevelSession(1)
    expect(session.status).toBe('ACTIVE')
    expect(session.mission.type).toBe('CLEAR_ALL_BUBBLES')
    expect(session.mission.startingBubbleCount).toBe(session.activeLevel.startingBubbles.length)
    expect(session.shotsUsedCount).toBe(0)
    expect(session.shotsRemaining).toBe(session.activeLevel.shotLimit)
    expect(session.activeLevel.allowedColors).toContain(session.gameplay.currentBubble.color)
    expect(session.activeLevel.allowedColors).toContain(session.gameplay.nextBubble.color)
  })

  it('consumes one shot only for an accepted fire request', () => {
    const session = new LevelSession(1)
    expect(session.updateAim({ x: 160, y: 300 })).toBe(true)
    expect(session.shotsUsedCount).toBe(0)
    expect(session.requestFire({ x: 160, y: 300 }).accepted).toBe(true)
    expect(session.shotsUsedCount).toBe(1)
    expect(session.requestFire({ x: 160, y: 300 })).toEqual({ accepted: false, reason: 'not-aiming' })
    expect(session.shotsUsedCount).toBe(1)
  })

  it('rejects input after explicit terminal level states', () => {
    const session = new LevelSession(1)
    const won = session as unknown as { levelStatus: 'ACTIVE' | 'WON' | 'LOST' }
    won.levelStatus = 'WON'
    expect(session.updateAim({ x: 100, y: 100 })).toBe(false)
    expect(session.requestFire({ x: 100, y: 300 })).toEqual({ accepted: false, reason: 'level-not-active' })
  })

  it('reloads and restarts without leaking board, shots, mission, or turn state', () => {
    const session = new LevelSession(1)
    const initialCount = session.mission.startingBubbleCount
    expect(session.requestFire({ x: 160, y: 300 }).accepted).toBe(true)
    expect(session.shotsUsedCount).toBe(1)
    expect(session.loadDevelopmentLevel(2)).toEqual({ ok: true })
    expect(session.activeLevel.id).toBe(2)
    expect(session.shotsUsedCount).toBe(0)
    expect(session.status).toBe('ACTIVE')
    expect(session.gameplay.lastTurnResult).toBeNull()
    expect(session.mission.startingBubbleCount).toBe(session.activeLevel.startingBubbles.length)
    expect(session.mission.startingBubbleCount).not.toBe(initialCount)
    session.restart()
    expect(session.shotsUsedCount).toBe(0)
    expect(session.status).toBe('ACTIVE')
    expect(session.gameplay.state).toBe('AIMING')
  })

  it('starts the requested next level with a populated board and active Clear All mission', () => {
    const session = new LevelSession(1)
    expect(session.loadDevelopmentLevel(2)).toEqual({ ok: true })
    expect(session.activeLevel.id).toBe(2)
    expect(session.gameplay.board.size).toBe(session.activeLevel.startingBubbles.length)
    expect(session.mission.type).toBe('CLEAR_ALL_BUBBLES')
    expect(session.mission.remainingBubbleCount).toBe(session.activeLevel.startingBubbles.length)
    expect(session.status).toBe('ACTIVE')
  })

  it('rejects locked normal loads while keeping the development override isolated', () => {
    const session = new LevelSession(1)
    expect(session.loadLevel(2)).toEqual({ ok: false, reason: 'level-locked' })
    expect(session.activeLevel.id).toBe(1)
    expect(session.loadDevelopmentLevel(2)).toEqual({ ok: true })
    expect(session.activeLevel.id).toBe(2)
  })
})
