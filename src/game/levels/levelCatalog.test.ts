import { describe, expect, it } from 'vitest'
import { CURATED_LEVELS } from './curatedLevels'
import { getAllCuratedLevels, getLevel } from './levelCatalog'
import { deriveStarThresholds } from './types'

describe('central level access', () => {
  it('resolves every approved curated level without generating content', () => {
    const levels = getAllCuratedLevels()
    expect(levels).toHaveLength(15)
    for (const [index, level] of levels.entries()) {
      const source = CURATED_LEVELS[index]
      expect(level.id).toBe(index + 1)
      expect(level.contentSource).toBe('curated')
      expect(level.startingBubbles).toEqual(source?.startingBubbles)
      expect(level.allowedColors).toEqual(source?.allowedColors)
      expect(level.shotLimit).toBe(source?.shotLimit)
      expect(level.mission.type).toBe('CLEAR_ALL_BUBBLES')
      expect(level.starThresholds).toEqual(source === undefined ? undefined : deriveStarThresholds(source))
    }
  })

  it('returns controlled results for invalid and unsupported IDs', () => {
    expect(getLevel(0)).toEqual({ ok: false, reason: 'invalid-level' })
    expect(getLevel(-1)).toEqual({ ok: false, reason: 'invalid-level' })
    expect(getLevel(1.5)).toEqual({ ok: false, reason: 'invalid-level' })
    expect(getLevel(16).ok).toBe(true)
    expect(getLevel(10000).ok).toBe(true)
    expect(getLevel(10001)).toEqual({ ok: false, reason: 'unsupported-level' })
  })

  it('returns immutable logically identical snapshots on repeated lookup', () => {
    const first = getLevel(1)
    const second = getLevel(1)
    expect(first).toEqual(second)
    if (first.ok) {
      expect(Object.isFrozen(first.level)).toBe(true)
      expect(Object.isFrozen(first.level.startingBubbles)).toBe(true)
      expect(() => (first.level.startingBubbles as Array<unknown>).push({})).toThrow()
    }
  })

  it('resolves generated levels on demand without changing curated content', () => {
    const first = getLevel(16)
    const second = getLevel(16)
    expect(first).toEqual(second)
    expect(first.ok && first.level.contentSource).toBe('generated')
    expect(getLevel(10000).ok).toBe(true)
    expect(getLevel(10001)).toEqual({ ok: false, reason: 'unsupported-level' })
  })
})
