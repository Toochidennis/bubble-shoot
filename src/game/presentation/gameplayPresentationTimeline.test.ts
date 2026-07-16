import { describe, expect, it } from 'vitest'

import { createHexGridConfig } from '../grid/gridConfig'
import type { FloatingResolutionResult } from '../floating/types'
import type { TurnResult } from '../session/types'
import { GameplayPresentationTimeline } from './gameplayPresentationTimeline'

const grid = createHexGridConfig({ rowCount: 6, evenRowWidth: 6, oddRowWidth: 5, bubbleRadius: 12, origin: { x: 16, y: 80 } })
const bubble = { color: 'blue' as const }
const projectile = {
  id: 'projectile-1', bubble, position: { x: 80, y: 120 }, direction: { x: 0, y: -1 }, speed: 600,
  radius: 12, travelDistance: 40, elapsedSeconds: .1, status: 'active' as const,
}

function floatingResult(): FloatingResolutionResult {
  return {
    ok: true,
    supportedCoordinates: [],
    floatingCoordinates: [{ row: 2, column: 2 }],
    removedBubbles: [{ coordinate: { row: 2, column: 2 }, center: { x: 64, y: 140 }, bubble: { color: 'green' } }],
    removalFailures: [], supportedCount: 1, floatingCount: 1, removedCount: 1, removedAny: true,
  }
}

function turn(overrides: Partial<TurnResult> = {}): TurnResult {
  return {
    turnNumber: 1,
    startingState: 'SHOOTING',
    finalState: 'TURN_COMPLETE',
    firedBubble: bubble,
    impact: { type: 'ceiling', position: { x: 80, y: 80 }, direction: { x: 0, y: -1 }, normal: { x: 0, y: 1 } },
    terminalProjectile: null,
    snap: { ok: true, coordinate: { row: 0, column: 2 }, center: { x: 64, y: 92 }, bubble, impactType: 'ceiling', impactedCoordinate: undefined, candidates: [] },
    match: null,
    floating: null,
    completed: true,
    reason: 'completed',
    ...overrides,
  }
}

describe('gameplay presentation timeline', () => {
  it('gates input during board entrance, then releases it deterministically', () => {
    const timeline = new GameplayPresentationTimeline()
    timeline.reset(4, 640)
    timeline.beginBoardEntrance()
    expect(timeline.isInputBlocked).toBe(true)
    timeline.advance(.05)
    expect(timeline.isInputBlocked).toBe(true)
    for (let index = 0; index < 10; index += 1) timeline.advance(.05)
    expect(timeline.isInputBlocked).toBe(false)
  })

  it('freezes every presentation clock while paused', () => {
    const timeline = new GameplayPresentationTimeline()
    timeline.reset(1, 640)
    timeline.emitAcceptedShot({ x: 50, y: 500 }, bubble)
    timeline.recordProjectile(projectile)
    const before = timeline.frame()
    timeline.setPaused(true)
    timeline.advance(.05)
    expect(timeline.frame().time).toBe(before.time)
    expect(timeline.frame().trail[0]?.age).toBe(before.trail[0]?.age)
    timeline.setPaused(false)
    timeline.advance(.05)
    expect(timeline.frame().time).toBeGreaterThan(before.time)
  })

  it('keeps effects frame-rate independent and particle storage bounded', () => {
    const fine = new GameplayPresentationTimeline(10)
    const coarse = new GameplayPresentationTimeline(10)
    for (const timeline of [fine, coarse]) {
      timeline.reset(2, 640)
      timeline.emitAcceptedShot({ x: 50, y: 500 }, bubble)
      for (let index = 0; index < 20; index += 1) timeline.emitWallBounce({ wall: index % 2 === 0 ? 'left' : 'right', position: { x: 20 + index, y: 300 } }, bubble)
    }
    fine.advance(.05)
    fine.advance(.05)
    for (let index = 0; index < 10; index += 1) coarse.advance(.01)
    expect(fine.frame().time).toBeCloseTo(coarse.frame().time, 6)
    expect(fine.frame().wallBounce?.wall).toBe('right')
    expect(coarse.frame().wallBounce?.color).toBe('blue')
    expect(fine.frame().particles.length).toBeLessThanOrEqual(10)
    expect(coarse.frame().particles.length).toBeLessThanOrEqual(10)
  })

  it('converts authoritative matches and floating removals into bounded visual copies', () => {
    const timeline = new GameplayPresentationTimeline()
    timeline.reset(8, 640)
    timeline.emitTurn(turn({
      match: {
        ok: true, matched: true, origin: { row: 0, column: 2 }, bubble, color: 'blue', cluster: [{ row: 0, column: 2 }], clusterSize: 4,
        removedCoordinates: [{ row: 0, column: 2 }], removedBubbles: [{ coordinate: { row: 0, column: 2 }, bubble }],
      },
      floating: floatingResult(),
    }), grid)
    timeline.advance(.05)
    const frame = timeline.frame()
    expect(frame.bubbleEffects).toHaveLength(1)
    expect(frame.bubbleEffects[0]?.ringAlpha).toBeGreaterThan(0)
    expect(frame.bubbleEffects[0]?.flashAlpha).toBeGreaterThan(0)
    expect(frame.matchPulse).not.toBeNull()
    expect(frame.particles.length).toBeGreaterThan(0)
    expect(frame.particles.some((particle) => particle.type === 'POP_FRAGMENT')).toBe(true)
    expect(frame.fallingBubbles).toHaveLength(0)
    timeline.advance(.1)
    expect(timeline.frame().fallingBubbles).toHaveLength(1)
    timeline.advance(.5)
    expect(timeline.frame().fallingBubbles).toHaveLength(1)
    for (let index = 0; index < 40; index += 1) timeline.advance(.05)
    expect(timeline.hasActiveEffects).toBe(false)
  })

  it('clears transient state on level reset', () => {
    const timeline = new GameplayPresentationTimeline()
    timeline.emitAcceptedShot({ x: 20, y: 20 }, bubble)
    timeline.recordProjectile(projectile)
    timeline.reset(9, 640)
    expect(timeline.frame().trail).toHaveLength(0)
    expect(timeline.frame().particles).toHaveLength(0)
    expect(timeline.frame().bubbleEffects).toHaveLength(0)
  })
})
