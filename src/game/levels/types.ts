import type { GridCoordinate } from '../grid/types'
import type { MissionConfiguration } from '../mission/types'
import type { MissionProgress, MissionSetProgress } from '../mission/types'
import type { BubbleColor } from '../shooter/types'
import type { HexGridConfig } from '../grid/gridConfig'

export interface CuratedBubblePlacement {
  readonly coordinate: GridCoordinate
  readonly color: BubbleColor
  readonly marked?: boolean
}

export interface StarThresholds {
  readonly one: number
  readonly two: number
  readonly three: number
}

export interface CuratedLevelDefinition {
  readonly id: number
  readonly displayNumber: number
  readonly allowedColors: readonly BubbleColor[]
  readonly shotLimit: number
  readonly mission: MissionConfiguration
  readonly startingBubbles: readonly CuratedBubblePlacement[]
  readonly onboardingBand: 'basic-onboarding' | 'early-skill-building' | 'stronger-onboarding'
  readonly focus: string
}

export type LevelContentSource = 'curated' | 'generated'

export interface NormalizedLevelDefinition {
  readonly id: number
  readonly displayNumber: number
  readonly gridConfig: HexGridConfig
  readonly allowedColors: readonly BubbleColor[]
  readonly shotLimit: number
  readonly mission: MissionConfiguration
  readonly startingBubbles: readonly CuratedBubblePlacement[]
  readonly starThresholds: StarThresholds
  readonly contentSource: LevelContentSource
  readonly onboardingBand: CuratedLevelDefinition['onboardingBand'] | 'generated'
  readonly focus: string
}

export function deriveStarThresholds(level: Pick<CuratedLevelDefinition, 'startingBubbles' | 'shotLimit'>): StarThresholds {
  const baseline = Math.max(10, level.startingBubbles.length * 10)
  const increment = Math.max(10, Math.floor(level.shotLimit * 5))
  return { one: baseline, two: baseline + increment, three: baseline + increment * 2 }
}

export type LevelStatus = 'ACTIVE' | 'WON' | 'LOST'

export type LevelLoadFailure = 'invalid-level' | 'level-not-found' | 'level-locked' | 'generation-failed'

export function evaluateLevelStatus(
  mission: Pick<MissionProgress | MissionSetProgress, 'completed'>,
  shotsRemaining: number,
): LevelStatus {
  if (mission.completed) return 'WON'
  if (shotsRemaining === 0) return 'LOST'
  return 'ACTIVE'
}
