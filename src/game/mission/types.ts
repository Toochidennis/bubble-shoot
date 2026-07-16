import type { HexBoard } from '../grid/HexBoard'
import type { BubbleColor, BubbleDescriptor } from '../shooter/types'

export type MissionType = 'CLEAR_ALL_BUBBLES' | 'POP_COLOR' | 'DROP_BUBBLES' | 'CLEAR_MARKED' | 'REACH_SCORE'
export type MissionSetType = 'MISSION_SET'

export type MissionConfig =
  | { readonly type: 'CLEAR_ALL_BUBBLES' }
  | { readonly type: 'POP_COLOR'; readonly targetColor: BubbleColor; readonly targetCount: number }
  | { readonly type: 'DROP_BUBBLES'; readonly targetCount: number }
  | { readonly type: 'CLEAR_MARKED'; readonly targetCount: number }
  | { readonly type: 'REACH_SCORE'; readonly targetScore: number }

export interface MissionSetConfig {
  readonly type: MissionSetType
  readonly objectives: readonly MissionConfig[]
}

export type MissionConfiguration = MissionConfig | MissionSetConfig

export interface MissionFeasibilityMetadata {
  readonly type: MissionType
  readonly targetColor?: BubbleColor
  readonly targetCount?: number
  readonly targetScore?: number
  readonly requiresEvent: 'board-clear' | 'direct-or-floating-removal' | 'floating-removal' | 'marked-removal' | 'score'
}

/** Backward-compatible Clear All progress shape retained for existing callers/tests. */
export interface MissionProgress {
  readonly type: 'CLEAR_ALL_BUBBLES'
  readonly startingBubbleCount: number
  readonly remainingBubbleCount: number
  readonly clearedBubbleCount: number
  readonly completed: boolean
}

export interface MissionObjectiveProgress {
  readonly objectiveId: string
  readonly type: MissionType
  readonly progress: number
  readonly target: number
  readonly remaining: number
  readonly completed: boolean
  readonly color?: BubbleColor
  readonly currentScore?: number
  readonly startingBubbleCount?: number
  readonly remainingBubbleCount?: number
  readonly clearedBubbleCount?: number
  readonly feasibility: MissionFeasibilityMetadata
}

export interface MissionSetProgress {
  readonly type: MissionType | MissionSetType
  readonly objectives: readonly MissionObjectiveProgress[]
  readonly changedObjectiveIds: readonly string[]
  readonly completedObjectiveIds: readonly string[]
  readonly completed: boolean
  /** Compatibility fields for the existing single Clear All mission HUD/API. */
  readonly startingBubbleCount: number
  readonly remainingBubbleCount: number
  readonly clearedBubbleCount: number
}

export function evaluateClearAllMission(
  board: HexBoard<BubbleDescriptor>,
  startingBubbleCount: number,
): MissionProgress {
  const remainingBubbleCount = board.size
  return {
    type: 'CLEAR_ALL_BUBBLES',
    startingBubbleCount,
    remainingBubbleCount,
    clearedBubbleCount: Math.max(0, startingBubbleCount - remainingBubbleCount),
    completed: remainingBubbleCount === 0,
  }
}
