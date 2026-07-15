import { describe, expect, it } from 'vitest'
import { ProgressionRepository } from './ProgressionRepository'
import { parseSaveData, serializeSaveData, validateSaveData } from './saveValidation'
import { calculateStars } from './stars'
import type { ProgressStorage } from './storage'
import { createDefaultSave } from './types'

class FakeStorage implements ProgressStorage {
  public value: string | null = null
  public failRead = false
  public failWrite = false
  public read(): string | null { if (this.failRead) throw new Error('read'); return this.value }
  public write(value: string): void { if (this.failWrite) throw new Error('write'); this.value = value }
}

describe('stars and progression persistence', () => {
  it('uses deterministic one, two, and three star thresholds', () => {
    const thresholds = { one: 100, two: 200, three: 300 }
    expect(thresholds.one).toBeLessThan(thresholds.two)
    expect(thresholds.two).toBeLessThan(thresholds.three)
    expect(calculateStars(99, thresholds, true)).toBe(1)
    expect(calculateStars(200, thresholds, true)).toBe(2)
    expect(calculateStars(300, thresholds, true)).toBe(3)
    expect(calculateStars(999, thresholds, false)).toBe(0)
  })

  it('starts with level one unlocked and records independent bests', () => {
    const storage = new FakeStorage()
    const repository = new ProgressionRepository(storage)
    expect(repository.highestUnlockedLevel).toBe(1)
    expect(repository.isLevelUnlocked(1)).toBe(true)
    expect(repository.isLevelUnlocked(2)).toBe(false)
    repository.recordCompletion(1, 100, 1)
    expect(repository.highestUnlockedLevel).toBe(2)
    repository.recordCompletion(1, 80, 3)
    expect(repository.getRecord(1)).toMatchObject({ bestScore: 100, bestStars: 3, completionCount: 2 })
    repository.recordCompletion(1, 120, 2)
    expect(repository.getRecord(1)).toMatchObject({ bestScore: 120, bestStars: 3 })
  })

  it('persists, reloads, and rejects malformed or unsupported saves safely', () => {
    const storage = new FakeStorage()
    const repository = new ProgressionRepository(storage)
    repository.recordCompletion(1, 250, 2)
    const reloaded = new ProgressionRepository(storage)
    expect(reloaded.getRecord(1)?.bestScore).toBe(250)
    storage.value = '{bad json'
    expect(new ProgressionRepository(storage).highestUnlockedLevel).toBe(1)
    storage.value = JSON.stringify({ schemaVersion: 99 })
    expect(new ProgressionRepository(storage).snapshot().lastLoadDiagnostic).toBe('unsupported-version')
    storage.value = JSON.stringify({ schemaVersion: 1, highestUnlockedLevel: 2, completionRecords: { '1': { levelId: 1, completed: true, bestScore: -1, bestStars: 4, completionCount: 1 } } })
    expect(new ProgressionRepository(storage).snapshot().lastLoadDiagnostic).toBe('invalid-shape')
  })

  it('keeps gameplay usable when storage reads or writes fail', () => {
    const storage = new FakeStorage()
    storage.failRead = true
    const repository = new ProgressionRepository(storage)
    expect(repository.highestUnlockedLevel).toBe(1)
    storage.failRead = false
    storage.failWrite = true
    expect(repository.recordCompletion(1, 100, 1).ok).toBe(true)
    expect(repository.snapshot().lastWriteFailed).toBe(true)
  })

  it('serializes the explicit schema and validates impossible values', () => {
    const save = createDefaultSave()
    expect(parseSaveData(serializeSaveData(save)).diagnostic).toBeNull()
    expect(validateSaveData({ ...save, highestUnlockedLevel: 10001 })).toBeNull()
    expect(validateSaveData({ ...save, completionRecords: { '16': { levelId: 16, completed: true, bestScore: 1, bestStars: 1, completionCount: 1 } } })).toBeNull()
  })

  it('extends sequential unlocks through generated content without inventing level 10001', () => {
    const repository = new ProgressionRepository(new FakeStorage())
    expect(repository.recordCompletion(15, 100, 1).ok).toBe(true)
    expect(repository.highestUnlockedLevel).toBe(16)
    expect(repository.recordCompletion(10000, 100, 1).ok).toBe(true)
    expect(repository.highestUnlockedLevel).toBe(10000)
    expect(repository.isLevelUnlocked(10001)).toBe(false)
  })
})
