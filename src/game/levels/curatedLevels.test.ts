import { describe, expect, it } from 'vitest'

import { getCuratedLevel, CURATED_LEVELS, getCuratedStructureMetrics, validateCuratedLevels } from './curatedLevels'
import { getNeighborCoordinates } from '../grid/neighbors'
import { DEFAULT_HEX_GRID_CONFIG } from '../grid/gridConfig'

describe('curated onboarding levels', () => {
  it('contains exactly 15 unique deterministic levels with valid mission and shot data', () => {
    expect(CURATED_LEVELS).toHaveLength(15)
    validateCuratedLevels()
    expect(new Set(CURATED_LEVELS.map((level) => level.id)).size).toBe(15)
    for (const level of CURATED_LEVELS) {
      expect(level.mission.type).toBe('CLEAR_ALL_BUBBLES')
      expect(level.shotLimit).toBeGreaterThan(0)
      expect(level.startingBubbles.length).toBeGreaterThan(0)
      expect(level.startingBubbles.every((placement) => level.allowedColors.includes(placement.color))).toBe(true)
      expect(level.startingBubbles.every((placement) => placement.marked !== true)).toBe(true)
    }
  })

  it('enforces the onboarding color bands', () => {
    expect(CURATED_LEVELS.slice(0, 5).every((level) => level.allowedColors.length === 3)).toBe(true)
    expect(CURATED_LEVELS.slice(5, 10).every((level) => level.allowedColors.length >= 3 && level.allowedColors.length <= 4)).toBe(true)
    expect(CURATED_LEVELS.slice(10).every((level) => level.allowedColors.length === 4)).toBe(true)
  })

  it('uses dense connected bubble-first formations for Levels 1-5', () => {
    const expectedRanges = [[59, 59], [64, 64], [69, 69], [74, 74], [79, 79]]
    for (const [index, level] of CURATED_LEVELS.slice(0, 5).entries()) {
      const [minimum, maximum] = expectedRanges[index]!
      expect(level.startingBubbles.length).toBeGreaterThanOrEqual(minimum!)
      expect(level.startingBubbles.length).toBeLessThanOrEqual(maximum!)
      const occupied = new Map(level.startingBubbles.map((placement) => [`${placement.coordinate.row}:${placement.coordinate.column}`, placement]))
      const roots = level.startingBubbles.filter((placement) => placement.coordinate.row === 0)
      const visited = new Set(roots.map((placement) => `${placement.coordinate.row}:${placement.coordinate.column}`))
      const queue = [...roots]
      while (queue.length > 0) {
        const current = queue.shift()!
        for (const neighbor of getNeighborCoordinates(DEFAULT_HEX_GRID_CONFIG, current.coordinate)) {
          const key = `${neighbor.row}:${neighbor.column}`
          if (occupied.has(key) && !visited.has(key)) {
            visited.add(key)
            queue.push(occupied.get(key)!)
          }
        }
      }
      expect(visited.size).toBe(level.startingBubbles.length)
      expect(level.startingBubbles.some((placement) => getNeighborCoordinates(DEFAULT_HEX_GRID_CONFIG, placement.coordinate).some((neighbor) => occupied.get(`${neighbor.row}:${neighbor.column}`)?.color === placement.color))).toBe(true)
    }
  })

  it('returns stable level lookup results', () => {
    expect(getCuratedLevel(1)).toEqual(getCuratedLevel(1))
    expect(getCuratedLevel(0)).toBeUndefined()
    expect(getCuratedLevel(16)).toBeUndefined()
  })

  it('rejects the old vertical two-column stripe look and keeps dense color-shaped boards', () => {
    const metrics = CURATED_LEVELS.map(getCuratedStructureMetrics)
    expect(metrics.every((metric) => metric.repeatedTwoColumnBandCount <= DEFAULT_HEX_GRID_CONFIG.evenRowWidth - 4)).toBe(true)
    expect(metrics.every((metric) => metric.sameColorClusterSizes.some((size) => size >= 2))).toBe(true)
    expect(metrics.slice(0, 5).every((metric) => metric.startingBubbleCount >= 59)).toBe(true)
    expect(metrics.slice(5, 10).every((metric) => metric.startingBubbleCount >= 84)).toBe(true)
    expect(metrics.slice(10).every((metric) => metric.startingBubbleCount >= 109)).toBe(true)
    expect(metrics.every((metric) => metric.topRowRootCount === DEFAULT_HEX_GRID_CONFIG.evenRowWidth)).toBe(true)
    expect(metrics.every((metric) => metric.lowerContourWidth >= DEFAULT_HEX_GRID_CONFIG.oddRowWidth - 1)).toBe(true)
    expect(metrics.slice(0, 5).every((metric) => metric.lowerHangingDepth >= 3)).toBe(true)
    expect(metrics.slice(10).every((metric) => metric.lowerHangingDepth >= 5)).toBe(true)
  })
})
