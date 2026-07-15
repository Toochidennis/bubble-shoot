import { describe, expect, it } from 'vitest'
import { getBubbleVisualThemeForLevel } from '../rendering/bubbleVisualTheme'
import { analyzeGeneratedBoard } from './analysis'
import { getGeneratedBubbleCountBand } from './boardBuilder'
import { generateGeneratedLevel } from './generator'
import { missionCompletesOnBoardExhaustion, validateGeneratedLevel } from './validator'

function evenlySpaced(start: number, end: number, count: number): number[] {
  if (count >= end - start + 1) return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  return Array.from({ length: count }, (_, index) => Math.round(start + (index * (end - start)) / Math.max(1, count - 1)))
}

export function representativeGeneratedLevelIds(): readonly number[] {
  return [
    ...evenlySpaced(16, 30, 15),
    ...evenlySpaced(31, 60, 30),
    ...evenlySpaced(61, 100, 40),
    ...evenlySpaced(101, 300, 100),
    ...evenlySpaced(301, 1_000, 150),
    ...evenlySpaced(1_001, 3_000, 180),
    ...evenlySpaced(3_001, 7_000, 230),
    ...evenlySpaced(7_001, 10_000, 255),
  ]
}

describe('1,000-level deterministic generated validation sample', () => {
  it('meets density, composition, mission, and exhaustion-safety requirements', () => {
    const ids = representativeGeneratedLevelIds()
    expect(ids).toHaveLength(1_000)
    expect(new Set(ids).size).toBe(1_000)
    const bubbleCounts: number[] = []
    const densities: number[] = []
    const shotLimits: number[] = []
    const retries: number[] = []
    const themes: Record<string, number> = {}
    const compositions: Record<string, number> = {}
    const missions: Record<string, number> = {}
    const objectiveTypes: Record<string, number> = {}
    let failures = 0

    for (const levelId of ids) {
      const result = generateGeneratedLevel(levelId)
      if (!result.ok) {
        failures += 1
        continue
      }
      const { level } = result
      expect(validateGeneratedLevel(level)).toEqual({ ok: true })
      const analysis = analyzeGeneratedBoard(level.gridConfig, level.startingBubbles)
      const markedCount = level.startingBubbles.filter((bubble) => bubble.marked === true).length
      expect(missionCompletesOnBoardExhaustion(level.mission, analysis, markedCount)).toBe(true)
      const band = getGeneratedBubbleCountBand(levelId)
      expect(level.startingBubbles.length).toBeGreaterThanOrEqual(band.minimum)
      expect(level.startingBubbles.length).toBeLessThanOrEqual(band.maximum)
      bubbleCounts.push(level.startingBubbles.length)
      densities.push(level.generator.boardMetrics.occupancyRatio)
      shotLimits.push(level.shotLimit)
      retries.push(level.generator.retryAttempt)
      const theme = getBubbleVisualThemeForLevel(levelId)
      themes[theme] = (themes[theme] ?? 0) + 1
      compositions[level.generator.colorCompositionId] = (compositions[level.generator.colorCompositionId] ?? 0) + 1
      missions[level.mission.type] = (missions[level.mission.type] ?? 0) + 1
      const objectives = level.mission.type === 'MISSION_SET' ? level.mission.objectives : [level.mission]
      for (const objective of objectives) objectiveTypes[objective.type] = (objectiveTypes[objective.type] ?? 0) + 1
    }

    expect(failures).toBe(0)
    const average = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
    const statistics = {
      sampleSize: ids.length,
      failures,
      retriesUsed: retries.filter((retry) => retry > 0).length,
      maximumRetry: Math.max(...retries),
      bubbles: { minimum: Math.min(...bubbleCounts), maximum: Math.max(...bubbleCounts), average: Number(average(bubbleCounts).toFixed(3)) },
      density: { minimum: Number(Math.min(...densities).toFixed(4)), maximum: Number(Math.max(...densities).toFixed(4)), average: Number(average(densities).toFixed(4)) },
      shots: { minimum: Math.min(...shotLimits), maximum: Math.max(...shotLimits), average: Number(average(shotLimits).toFixed(3)) },
      themes,
      compositions,
      missions,
      objectiveTypes,
    }
    console.info(`GENERATED_SAMPLE_STATS ${JSON.stringify(statistics)}`)
    expect(Object.keys(compositions)).toHaveLength(10)
    expect(Object.keys(themes).length).toBeGreaterThanOrEqual(5)
  }, 120_000)
})

