import { describe, expect, it } from 'vitest'

import { predictTrajectory } from '../shooter/trajectory'
import { getGameplayCeilingRailModel, getGameplayTrajectoryDots, MAX_TRAJECTORY_DOTS } from './drawGameplayFrame'

describe('gameplay trajectory presentation', () => {
  it('derives a bounded, deterministic, bubble-color-aware dot path from the authoritative trajectory', () => {
    const trajectory = predictTrajectory(
      { x: 160, y: 500 },
      { x: 0.32, y: -0.95 },
      { leftWallX: 18, rightWallX: 302, topY: 18, maxDistance: 1200, maxSegments: 8 },
    )
    const first = getGameplayTrajectoryDots(trajectory, 'red')
    const second = getGameplayTrajectoryDots(trajectory, 'red')
    expect(first.length).toBeGreaterThan(0)
    expect(first.length).toBeLessThanOrEqual(MAX_TRAJECTORY_DOTS)
    expect(first).toEqual(second)
    expect(first.every((dot) => dot.color === '#e26a78')).toBe(true)
    expect(first.some((dot) => dot.position.x !== first[0]!.position.x)).toBe(true)
    expect(first[0]!.radius).toBeGreaterThan(first.at(-1)!.radius)
    const initial = first[0]!.position
    const initialLength = Math.hypot(initial.x - 160, initial.y - 500)
    expect((initial.x - 160) / initialLength).toBeCloseTo(0.32, 1)
    expect((initial.y - 500) / initialLength).toBeCloseTo(-0.95, 1)
  })

  it('keeps the visible ceiling rail model on the authoritative gameplay ceiling', () => {
    const rail = getGameplayCeilingRailModel(320, 112)
    expect(rail.y).toBe(112)
    expect(rail.accentXs).toEqual([rail.inset, 160, 320 - rail.inset])
  })
})
