import { describe, expect, it } from 'vitest'
import { getDifficultyProfile, getDifficultyWave } from './difficulty'
import { generateGeneratedLevel } from './generator'
import { deriveGenerationSeed, deriveRetrySeed } from './seed'
import { validateGeneratedLevel } from './validator'
import { getTemplateIds } from '../templates/templateRegistry'

describe('deterministic generated levels', () => {
  it('uses versioned identity seeds and stable retry streams', () => {
    expect(deriveGenerationSeed(16)).toBe('level:16|generator:1|config:5|retry:0')
    expect(deriveRetrySeed(16, 1)).not.toBe(deriveRetrySeed(16, 0))
    expect(deriveRetrySeed(16, 1)).toBe(deriveGenerationSeed(16, 1))
  })

  it('keeps difficulty waves explicit and includes recovery bands', () => {
    expect(getDifficultyWave()).toContain('recovery')
    expect(getDifficultyProfile(16).difficulty).toBe('easy')
    expect(getDifficultyProfile(21).difficulty).toBe('recovery')
    expect(getDifficultyProfile(24).difficulty).toBe('challenge')
  })

  it('generates deterministic, validated content throughout the supported range', () => {
    for (const levelId of [16, 17, 4827, 10000]) {
      const first = generateGeneratedLevel(levelId)
      const second = generateGeneratedLevel(levelId)
      expect(first).toEqual(second)
      expect(first.ok).toBe(true)
      if (first.ok) {
        expect(validateGeneratedLevel(first.level)).toEqual({ ok: true })
        expect(getTemplateIds()).toContain(first.level.generator.templateId)
        expect(first.level.startingBubbles.length).toBeGreaterThan(0)
        expect(first.level.generator.boardMetrics.occupancyRatio).toBeGreaterThanOrEqual(.92)
        expect(first.level.generator.boardMetrics.occupancyRatio).toBeLessThanOrEqual(1)
        expect(first.level.generator.boardMetrics.upperRowOccupancy).toBe(1)
      }
    }
  })

  it.each([
    [16, 59, 110],
    [100, 59, 110],
    [101, 76, 140],
    [1000, 76, 140],
    [1001, 96, 175],
    [10000, 116, 200],
  ])('keeps generated Level %i in its presentation-density band', (levelId, minimum, maximum) => {
    const result = generateGeneratedLevel(levelId)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.level.startingBubbles.length).toBeGreaterThanOrEqual(minimum)
    expect(result.level.startingBubbles.length).toBeLessThanOrEqual(maximum)
    expect(result.level.generator.boardMetrics.formationDepth).toBeGreaterThanOrEqual(7)
    expect(result.level.generator.boardMetrics.formationWidth).toBeGreaterThanOrEqual(5.5)
  })

  it('rejects invalid IDs and bounds retries for invalid candidates', () => {
    expect(generateGeneratedLevel(15)).toMatchObject({ ok: false, reason: 'unsupported-level-id' })
    expect(generateGeneratedLevel(10001)).toMatchObject({ ok: false, reason: 'unsupported-level-id' })
    const result = generateGeneratedLevel(16, { maxRetries: 2, candidateFactory: () => ({}) as never })
    expect(result).toMatchObject({ ok: false, reason: 'generation-failed', attempts: 3 })
  })
})
