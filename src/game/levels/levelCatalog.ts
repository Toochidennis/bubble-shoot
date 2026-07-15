import { DEFAULT_HEX_GRID_CONFIG } from '../grid/gridConfig'
import { deriveStarThresholds } from './types'
import type { CuratedBubblePlacement, CuratedLevelDefinition, LevelLoadFailure, NormalizedLevelDefinition } from './types'
import { getCuratedLevel } from './curatedLevels'
import { FIRST_GENERATED_LEVEL_ID, MAX_SUPPORTED_LEVEL_ID } from '../generation/config'
import { generateGeneratedLevel } from '../generation/generator'

export type LevelAccessFailure = Extract<LevelLoadFailure, 'level-not-found' | 'invalid-level' | 'generation-failed'> | 'unsupported-level'

export type LevelAccessResult =
  | { readonly ok: true; readonly level: NormalizedLevelDefinition }
  | { readonly ok: false; readonly reason: LevelAccessFailure }

function clonePlacement(placement: CuratedBubblePlacement): CuratedBubblePlacement {
  return Object.freeze(placement.marked === true
    ? { coordinate: Object.freeze({ ...placement.coordinate }), color: placement.color, marked: true }
    : { coordinate: Object.freeze({ ...placement.coordinate }), color: placement.color })
}

function normalizeCuratedLevel(level: CuratedLevelDefinition): NormalizedLevelDefinition {
  const gridConfig = Object.freeze({ ...DEFAULT_HEX_GRID_CONFIG, origin: Object.freeze({ ...DEFAULT_HEX_GRID_CONFIG.origin }) })
  const normalized = {
    id: level.id,
    displayNumber: level.displayNumber,
    gridConfig,
    allowedColors: Object.freeze([...level.allowedColors]),
    shotLimit: level.shotLimit,
    mission: Object.freeze({ ...level.mission }),
    startingBubbles: Object.freeze(level.startingBubbles.map(clonePlacement)),
    starThresholds: Object.freeze(deriveStarThresholds(level)),
    contentSource: 'curated' as const,
    onboardingBand: level.onboardingBand,
    focus: level.focus,
  }
  return Object.freeze(normalized)
}

export function getLevel(levelId: number): LevelAccessResult {
  if (!Number.isSafeInteger(levelId) || levelId < 1) return { ok: false, reason: 'invalid-level' }
  if (levelId > MAX_SUPPORTED_LEVEL_ID) return { ok: false, reason: 'unsupported-level' }
  const curated = getCuratedLevel(levelId)
  if (curated !== undefined) return { ok: true, level: normalizeCuratedLevel(curated) }
  if (levelId >= FIRST_GENERATED_LEVEL_ID) {
    const generated = generateGeneratedLevel(levelId)
    return generated.ok ? generated : { ok: false, reason: 'generation-failed' }
  }
  return { ok: false, reason: 'level-not-found' }
}

export function getAllCuratedLevels(): readonly NormalizedLevelDefinition[] {
  return Object.freeze(Array.from({ length: 15 }, (_, index) => {
    const result = getLevel(index + 1)
    if (!result.ok) throw new Error(`Curated level ${index + 1} is unavailable.`)
    return result.level
  }))
}
