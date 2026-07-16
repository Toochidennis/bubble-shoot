import type { CompletionRecord } from '../progression/types'

export type MapLevelState = 'completed' | 'current' | 'unlocked' | 'locked'

export function getMapLevelState(levelId: number, highestUnlocked: number, record: CompletionRecord | null): MapLevelState {
  if (record?.completed === true) return 'completed'
  if (levelId === highestUnlocked) return 'current'
  if (levelId <= highestUnlocked) return 'unlocked'
  return 'locked'
}

export function getQuickPlayLevel(highestUnlocked: number, maximumLevel: number): number {
  return Math.min(Math.max(1, Number.isSafeInteger(highestUnlocked) ? highestUnlocked : 1), maximumLevel)
}
