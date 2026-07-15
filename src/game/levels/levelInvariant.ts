import type { MissionConfiguration, MissionSetProgress } from '../mission/types'
import type { LevelContentSource } from './types'

export interface EmptyBoardMissionInvariantDiagnostic {
  readonly type: 'EMPTY_BOARD_INCOMPLETE_MISSION'
  readonly levelId: number
  readonly missionDefinition: MissionConfiguration
  readonly missionProgress: MissionSetProgress
  readonly startingBubbleCount: number
  readonly processedTurnNumber: number
}

export function detectEmptyBoardMissionInvariant(input: {
  readonly contentSource: LevelContentSource
  readonly boardSize: number
  readonly levelId: number
  readonly missionDefinition: MissionConfiguration
  readonly missionProgress: MissionSetProgress
  readonly startingBubbleCount: number
  readonly processedTurnNumber: number
}): EmptyBoardMissionInvariantDiagnostic | null {
  if (input.contentSource !== 'generated' || input.boardSize !== 0 || input.missionProgress.completed) return null
  return {
    type: 'EMPTY_BOARD_INCOMPLETE_MISSION',
    levelId: input.levelId,
    missionDefinition: input.missionDefinition,
    missionProgress: input.missionProgress,
    startingBubbleCount: input.startingBubbleCount,
    processedTurnNumber: input.processedTurnNumber,
  }
}

