import { MAX_SUPPORTED_LEVEL_ID as GENERATION_LEVEL_CAP } from '../generation/config'

export const SAVE_SCHEMA_VERSION = 1 as const
export const FIRST_CURATED_LEVEL = 1 as const
export const LAST_CURATED_LEVEL = 15 as const
export const MAX_SUPPORTED_LEVEL_ID = GENERATION_LEVEL_CAP

export interface CompletionRecord {
  readonly levelId: number
  readonly completed: boolean
  readonly bestScore: number
  readonly bestStars: number
  readonly completionCount: number
}

export interface SaveData {
  readonly schemaVersion: typeof SAVE_SCHEMA_VERSION
  readonly highestUnlockedLevel: number
  readonly completionRecords: Readonly<Record<string, CompletionRecord>>
}

export type SaveLoadDiagnostic =
  | 'missing'
  | 'invalid-json'
  | 'invalid-shape'
  | 'unsupported-version'
  | 'storage-read-failure'

export interface ProgressionSnapshot {
  readonly save: SaveData
  readonly lastLoadDiagnostic: SaveLoadDiagnostic | null
  readonly lastWriteFailed: boolean
}

export function createDefaultSave(): SaveData {
  return { schemaVersion: SAVE_SCHEMA_VERSION, highestUnlockedLevel: FIRST_CURATED_LEVEL, completionRecords: {} }
}
