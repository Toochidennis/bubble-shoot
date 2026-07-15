import { createDefaultSave, FIRST_CURATED_LEVEL, MAX_SUPPORTED_LEVEL_ID, SAVE_SCHEMA_VERSION } from './types'
import type { CompletionRecord, SaveData } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validLevelId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= FIRST_CURATED_LEVEL && value <= MAX_SUPPORTED_LEVEL_ID
}

function normalizeCompletionRecord(value: unknown, key: string): CompletionRecord | null {
  if (!isRecord(value) || !validLevelId(value.levelId) || String(value.levelId) !== key) return null
  if (typeof value.completed !== 'boolean') return null
  if (typeof value.bestScore !== 'number' || !Number.isFinite(value.bestScore) || value.bestScore < 0) return null
  if (typeof value.bestStars !== 'number' || !Number.isSafeInteger(value.bestStars) || value.bestStars < 0 || value.bestStars > 3) return null
  const completionCount = value.completionCount === undefined ? 1 : value.completionCount
  if (typeof completionCount !== 'number' || !Number.isSafeInteger(completionCount) || completionCount < 0) return null
  return { levelId: value.levelId, completed: value.completed, bestScore: value.bestScore, bestStars: value.bestStars, completionCount }
}

export function validateSaveData(value: unknown): SaveData | null {
  if (!isRecord(value) || value.schemaVersion !== SAVE_SCHEMA_VERSION) return null
  if (!validLevelId(value.highestUnlockedLevel) || !isRecord(value.completionRecords)) return null
  const records: Record<string, CompletionRecord> = {}
  for (const [key, record] of Object.entries(value.completionRecords)) {
    const normalized = normalizeCompletionRecord(record, key)
    if (normalized === null) return null
    records[key] = normalized
  }
  const highestRecord = Object.values(records).reduce((highest, record) => Math.max(highest, record.completed ? record.levelId : 0), 0)
  if (highestRecord > 0 && value.highestUnlockedLevel < Math.min(MAX_SUPPORTED_LEVEL_ID, highestRecord + 1)) return null
  if (value.highestUnlockedLevel > Math.min(MAX_SUPPORTED_LEVEL_ID, highestRecord + 1) && value.highestUnlockedLevel !== FIRST_CURATED_LEVEL) return null
  return { schemaVersion: SAVE_SCHEMA_VERSION, highestUnlockedLevel: value.highestUnlockedLevel, completionRecords: records }
}

export function serializeSaveData(save: SaveData): string {
  return JSON.stringify(save)
}

export function migrateSaveData(value: unknown): SaveData | null {
  if (!isRecord(value) || value.schemaVersion !== SAVE_SCHEMA_VERSION) return null
  return validateSaveData(value)
}

export function parseSaveData(raw: string): { save: SaveData; diagnostic: null } | { save: SaveData; diagnostic: 'invalid-json' | 'invalid-shape' | 'unsupported-version' } {
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value)) return { save: createDefaultSave(), diagnostic: 'invalid-shape' }
    if (value.schemaVersion !== SAVE_SCHEMA_VERSION) return { save: createDefaultSave(), diagnostic: 'unsupported-version' }
    const save = migrateSaveData(value)
    return save === null ? { save: createDefaultSave(), diagnostic: 'invalid-shape' } : { save, diagnostic: null }
  } catch {
    return { save: createDefaultSave(), diagnostic: 'invalid-json' }
  }
}
