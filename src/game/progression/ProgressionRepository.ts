import { isSupportedLevelId } from '../generation/config'
import { parseSaveData, serializeSaveData } from './saveValidation'
import { LocalStorageProgressStorage } from './storage'
import type { ProgressStorage } from './storage'
import { createDefaultSave, MAX_SUPPORTED_LEVEL_ID } from './types'
import type { CompletionRecord, ProgressionSnapshot, SaveData } from './types'

export class ProgressionRepository {
  private save: SaveData
  private readonly storage: ProgressStorage
  private lastLoadDiagnostic: ProgressionSnapshot['lastLoadDiagnostic'] = null
  private lastWriteFailed = false

  public constructor(storage: ProgressStorage = new LocalStorageProgressStorage()) {
    this.storage = storage
    const raw = this.readStorage()
    if (raw === null) {
      this.save = createDefaultSave()
      if (this.lastLoadDiagnostic === null) this.lastLoadDiagnostic = 'missing'
    } else {
      const parsed = parseSaveData(raw)
      this.save = parsed.save
      this.lastLoadDiagnostic = parsed.diagnostic
    }
  }

  public snapshot(): ProgressionSnapshot {
    return { save: this.save, lastLoadDiagnostic: this.lastLoadDiagnostic, lastWriteFailed: this.lastWriteFailed }
  }

  public get highestUnlockedLevel(): number {
    return this.save.highestUnlockedLevel
  }

  public isLevelUnlocked(levelId: number): boolean {
    return isSupportedLevelId(levelId) && levelId <= this.save.highestUnlockedLevel
  }

  public getRecord(levelId: number): CompletionRecord | null {
    return this.save.completionRecords[String(levelId)] ?? null
  }

  public recordCompletion(levelId: number, score: number, stars: number): { ok: true; record: CompletionRecord; changed: boolean } | { ok: false; reason: 'invalid-level' | 'invalid-score' | 'invalid-stars' } {
    if (!isSupportedLevelId(levelId)) return { ok: false, reason: 'invalid-level' }
    if (!Number.isFinite(score) || score < 0) return { ok: false, reason: 'invalid-score' }
    if (!Number.isSafeInteger(stars) || stars < 1 || stars > 3) return { ok: false, reason: 'invalid-stars' }
    const previous = this.getRecord(levelId)
    const next: CompletionRecord = {
      levelId,
      completed: true,
      bestScore: Math.max(previous?.bestScore ?? 0, score),
      bestStars: Math.max(previous?.bestStars ?? 0, stars),
      completionCount: (previous?.completionCount ?? 0) + 1,
    }
    const nextHighest = Math.max(this.save.highestUnlockedLevel, Math.min(MAX_SUPPORTED_LEVEL_ID, levelId + 1))
    const changed = previous === null || next.bestScore !== previous.bestScore || next.bestStars !== previous.bestStars || next.completionCount !== previous.completionCount || nextHighest !== this.save.highestUnlockedLevel
    this.save = { ...this.save, highestUnlockedLevel: nextHighest, completionRecords: { ...this.save.completionRecords, [String(levelId)]: next } }
    if (changed) this.persist()
    return { ok: true, record: next, changed }
  }

  public clear(): void {
    this.save = createDefaultSave()
    this.lastWriteFailed = false
    this.persist()
  }

  private readStorage(): string | null {
    try {
      return this.storage.read()
    } catch {
      this.lastLoadDiagnostic = 'storage-read-failure'
      return null
    }
  }

  private persist(): void {
    try {
      this.storage.write(serializeSaveData(this.save))
      this.lastWriteFailed = false
    } catch {
      this.lastWriteFailed = true
    }
  }
}

export function createDefaultProgressionRepository(storage?: ProgressStorage): ProgressionRepository {
  return new ProgressionRepository(storage)
}
