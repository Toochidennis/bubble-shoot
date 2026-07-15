import { describe, expect, it } from 'vitest'

import {
  aimDirectionFromPointer,
  clampAimAngle,
  DEFAULT_AIM_LIMITS,
} from './aimMath'

const origin = { x: 100, y: 100 }

describe('aim direction math', () => {
  it('aims directly upward and normalizes the result', () => {
    const result = aimDirectionFromPointer(origin, { x: 100, y: 0 })

    expect(result.angleRadians).toBe(0)
    expect(result.direction.x).toBeCloseTo(0)
    expect(result.direction.y).toBeCloseTo(-1)
    expect(Math.hypot(result.direction.x, result.direction.y)).toBeCloseTo(1)
  })

  it('aims upper-left and upper-right with signed angles', () => {
    const left = aimDirectionFromPointer(origin, { x: 0, y: 0 })
    const right = aimDirectionFromPointer(origin, { x: 200, y: 0 })

    expect(left.angleRadians).toBeCloseTo(-Math.PI / 4)
    expect(right.angleRadians).toBeCloseTo(Math.PI / 4)
    expect(left.direction.x).toBeLessThan(0)
    expect(right.direction.x).toBeGreaterThan(0)
  })

  it('returns stable upward aim for a pointer at the shooter or directly below', () => {
    expect(aimDirectionFromPointer(origin, origin).angleRadians).toBe(0)
    expect(aimDirectionFromPointer(origin, { x: 100, y: 300 }).angleRadians).toBe(0)
  })

  it('clamps extreme left and right input to safe limits', () => {
    const left = aimDirectionFromPointer(origin, { x: -1000, y: 99 })
    const right = aimDirectionFromPointer(origin, { x: 1200, y: 99 })

    expect(left.angleRadians).toBe(DEFAULT_AIM_LIMITS.minAngleRadians)
    expect(right.angleRadians).toBe(DEFAULT_AIM_LIMITS.maxAngleRadians)
    expect(left.direction.y).toBeLessThan(0)
    expect(right.direction.y).toBeLessThan(0)
  })
})

describe('aim angle limits', () => {
  it('preserves valid angles and clamps shallow angles deterministically', () => {
    expect(clampAimAngle(0.2)).toBe(0.2)
    expect(clampAimAngle(-Math.PI / 2)).toBe(DEFAULT_AIM_LIMITS.minAngleRadians)
    expect(clampAimAngle(Math.PI / 2)).toBe(DEFAULT_AIM_LIMITS.maxAngleRadians)
    expect(clampAimAngle(DEFAULT_AIM_LIMITS.maxAngleRadians)).toBe(
      DEFAULT_AIM_LIMITS.maxAngleRadians,
    )
  })
})

