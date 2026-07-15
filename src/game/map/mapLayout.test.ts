import { describe, expect, it } from 'vitest'
import { DEFAULT_MAP_LAYOUT, getMapContentHeight, getMapFocusScrollTop, getMapNodeLayout, getVisibleLevelRange } from './mapLayout'

describe('deterministic level-map layout', () => {
  it('keeps positions stable, bounded, and progressively vertical', () => {
    const ids = [1, 2, 5000, 10000]
    const positions = ids.map((id) => getMapNodeLayout(id))
    expect(positions).toEqual(ids.map((id) => getMapNodeLayout(id)))
    expect(positions.every((position) => position.x >= -1 && position.x <= 1)).toBe(true)
    expect(positions[0]!.y).toBeLessThan(positions[1]!.y)
    expect(positions[1]!.y).toBeLessThan(positions[2]!.y)
    expect(positions[2]!.y).toBeLessThan(positions[3]!.y)
    expect(getMapContentHeight()).toBeGreaterThan(1_000_000)
  })

  it('calculates bounded overscanned windows without generating preceding nodes', () => {
    expect(getVisibleLevelRange(0, 640)).toEqual({ start: 1, end: 10 })
    const middle = getVisibleLevelRange(5000 * DEFAULT_MAP_LAYOUT.nodeStride, 640)
    expect(middle.start).toBeGreaterThan(4990)
    expect(middle.end - middle.start).toBeLessThan(20)
    const end = getVisibleLevelRange(Number.MAX_SAFE_INTEGER, 640)
    expect(end.end).toBe(10000)
    expect(end.start).toBeGreaterThan(9990)
  })

  it('focuses near the requested progression level', () => {
    expect(getMapFocusScrollTop(1, 640)).toBe(0)
    expect(getMapFocusScrollTop(145, 640)).toBeGreaterThan(0)
    expect(getMapFocusScrollTop(10001, 640)).toBe(getMapFocusScrollTop(10000, 640))
  })
})
