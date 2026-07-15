import { describe, expect, it } from 'vitest'

import { predictTrajectory } from './trajectory'

const bounds = {
  leftWallX: 0,
  rightWallX: 100,
  topY: 0,
  maxDistance: 500,
  maxSegments: 8,
}

describe('trajectory prediction', () => {
  it('stops a direct upward path at the maximum distance', () => {
    const preview = predictTrajectory({ x: 50, y: 100 }, { x: 0, y: -1 }, {
      ...bounds,
      maxDistance: 50,
    })

    expect(preview.segments).toHaveLength(1)
    expect(preview.segments[0]).toMatchObject({
      end: { x: 50, y: 50 },
      hit: 'max-distance',
      distance: 50,
    })
    expect(preview.endReason).toBe('max-distance')
  })

  it('stops a direct upward path at the top boundary', () => {
    const preview = predictTrajectory({ x: 50, y: 100 }, { x: 0, y: -1 }, bounds)

    expect(preview.segments[0]).toMatchObject({
      end: { x: 50, y: 0 },
      hit: 'top-boundary',
    })
    expect(preview.endReason).toBe('top-boundary')
  })

  it('reflects from the left wall and continues upward', () => {
    const preview = predictTrajectory({ x: 50, y: 100 }, { x: -0.6, y: -0.8 }, bounds)

    expect(preview.segments[0]!.hit).toBe('left-wall')
    expect(preview.segments[0]!.end.x).toBeCloseTo(0)
    expect(preview.segments[1]!.start.x).toBeCloseTo(0)
    expect(preview.segments[1]!.end.x).toBeGreaterThan(0)
    expect(preview.segments[1]!.hit).toBe('top-boundary')
  })

  it('reflects from the right wall symmetrically', () => {
    const preview = predictTrajectory({ x: 50, y: 100 }, { x: 0.6, y: -0.8 }, bounds)

    expect(preview.segments[0]!.hit).toBe('right-wall')
    expect(preview.segments[0]!.end.x).toBeCloseTo(100)
    expect(preview.segments[1]!.start.x).toBeCloseTo(100)
    expect(preview.segments[1]!.end.x).toBeLessThan(100)
  })

  it('supports multiple reflections and deterministic output', () => {
    const origin = { x: 50, y: 100 }
    const direction = { x: -0.8, y: -0.6 }
    const reflectedBounds = { ...bounds, topY: -100 }
    const first = predictTrajectory(origin, direction, reflectedBounds)
    const second = predictTrajectory(origin, direction, reflectedBounds)

    expect(first).toEqual(second)
    expect(first.segments.map((segment) => segment.hit)).toEqual([
      'left-wall',
      'right-wall',
      'left-wall',
      'top-boundary',
    ])
  })

  it('honors the segment limit without looping forever', () => {
    const preview = predictTrajectory({ x: 50, y: 100 }, { x: -0.8, y: -0.6 }, {
      ...bounds,
      topY: -100,
      maxSegments: 1,
    })

    expect(preview.segments).toHaveLength(1)
    expect(preview.endReason).toBe('segment-limit')
    expect(preview.totalDistance).toBeGreaterThan(0)
  })

  it('rejects non-upward directions', () => {
    expect(() => predictTrajectory({ x: 50, y: 100 }, { x: 0, y: 1 }, bounds)).toThrow(
      RangeError,
    )
  })
})
