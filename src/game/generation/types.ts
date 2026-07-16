import type { NormalizedLevelDefinition } from '../levels/types'
import type { TemplateDifficulty } from '../templates/types'
import type { ColorCompositionId } from './colorComposition'

export interface GeneratedBoardMetrics {
  readonly validGridCapacity: number
  readonly intendedRegionCapacity: number
  readonly occupiedCellCount: number
  readonly occupancyRatio: number
  readonly occupiedRowCount: number
  readonly upperRowOccupancy: number
  readonly largestEmptyCentralRegion: number
  readonly formationWidth: number
  readonly formationDepth: number
  readonly averageSameColorClusterSize: number
  readonly largestSameColorClusterSize: number
  readonly validatedDropOpportunity: number
  readonly conservativeScoreFloor: number
}

export type GeneratedDifficulty = TemplateDifficulty | 'recovery'

export interface GeneratedLevelMetadata {
  readonly generatorVersion: number
  readonly generatorConfigVersion: number
  readonly retryAttempt: number
  readonly seed: string
  readonly difficulty: GeneratedDifficulty
  readonly templateId: string
  readonly colorCompositionId: ColorCompositionId
  readonly targetBubbleCount: number
  readonly estimatedFloatingPotential: number
  readonly boardMetrics: GeneratedBoardMetrics
}

export type GeneratedLevelDefinition = NormalizedLevelDefinition & {
  readonly contentSource: 'generated'
  readonly generator: GeneratedLevelMetadata
}

export type GenerationFailureReason = 'invalid-level-id' | 'unsupported-level-id' | 'generation-failed'

export type GeneratedLevelResult =
  | { readonly ok: true; readonly level: GeneratedLevelDefinition }
  | { readonly ok: false; readonly reason: GenerationFailureReason; readonly attempts: number; readonly errors: readonly string[] }
