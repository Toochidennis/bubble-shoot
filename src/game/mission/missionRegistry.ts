import type { HexBoard } from '../grid/HexBoard'
import type { BubbleDescriptor } from '../shooter/types'
import type { TurnResult } from '../session/types'
import type {
  MissionConfig,
  MissionFeasibilityMetadata,
  MissionObjectiveProgress,
  MissionType,
  MissionConfiguration,
} from './types'

export interface MissionEvent {
  readonly id: string
  readonly turn: TurnResult
  readonly board: HexBoard<BubbleDescriptor>
  readonly currentScore: number
}

export interface MissionDefinition {
  readonly type: MissionType
  readonly name: string
  readonly supportedEvents: readonly ('board-clear' | 'direct-removal' | 'floating-removal' | 'marked-removal' | 'score')[]
  readonly validate: (config: MissionConfig) => void
  readonly createInitial: (config: MissionConfig, objectiveId: string, board: HexBoard<BubbleDescriptor>, startingBubbleCount: number) => MissionObjectiveProgress
  readonly update: (config: MissionConfig, previous: MissionObjectiveProgress, event: MissionEvent) => MissionObjectiveProgress
}

function positiveCount(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`${label} must be a positive safe integer.`)
}

function positiveScore(value: number): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError('REACH_SCORE target must be finite and positive.')
}

function feasibility(config: MissionConfig): MissionFeasibilityMetadata {
  switch (config.type) {
    case 'CLEAR_ALL_BUBBLES': return { type: config.type, requiresEvent: 'board-clear' }
    case 'POP_COLOR': return { type: config.type, targetColor: config.targetColor, targetCount: config.targetCount, requiresEvent: 'direct-or-floating-removal' }
    case 'DROP_BUBBLES': return { type: config.type, targetCount: config.targetCount, requiresEvent: 'floating-removal' }
    case 'CLEAR_MARKED': return { type: config.type, targetCount: config.targetCount, requiresEvent: 'marked-removal' }
    case 'REACH_SCORE': return { type: config.type, targetScore: config.targetScore, requiresEvent: 'score' }
  }
}

function countProgress(previous: MissionObjectiveProgress, amount: number, target: number): number {
  return Math.min(target, previous.progress + Math.max(0, amount))
}

function createProgress(config: MissionConfig, objectiveId: string, progress: number, target: number, extras: Partial<MissionObjectiveProgress> = {}): MissionObjectiveProgress {
  const safeProgress = Math.min(target, Math.max(0, progress))
  return {
    objectiveId,
    type: config.type,
    progress: safeProgress,
    target,
    remaining: Math.max(0, target - safeProgress),
    completed: safeProgress >= target,
    feasibility: feasibility(config),
    ...extras,
  }
}

function directRemoved(turn: TurnResult): readonly BubbleDescriptor[] {
  return turn.match?.ok === true && turn.match.matched ? turn.match.removedBubbles?.map((value) => value.bubble) ?? [] : []
}

function floatingRemoved(turn: TurnResult): readonly BubbleDescriptor[] {
  return turn.floating?.removedBubbles.map((value) => value.bubble) ?? []
}

function validateClear(config: MissionConfig): void {
  if (config.type !== 'CLEAR_ALL_BUBBLES') throw new RangeError('Invalid CLEAR_ALL_BUBBLES configuration.')
}

function validatePop(config: MissionConfig): void {
  if (config.type !== 'POP_COLOR' || !['blue', 'green', 'purple', 'red', 'yellow'].includes(config.targetColor)) throw new RangeError('Invalid POP_COLOR configuration.')
  positiveCount(config.targetCount, 'POP_COLOR targetCount')
}

function validateDrop(config: MissionConfig): void {
  if (config.type !== 'DROP_BUBBLES') throw new RangeError('Invalid DROP_BUBBLES configuration.')
  positiveCount(config.targetCount, 'DROP_BUBBLES targetCount')
}

function validateMarked(config: MissionConfig): void {
  if (config.type !== 'CLEAR_MARKED') throw new RangeError('Invalid CLEAR_MARKED configuration.')
  positiveCount(config.targetCount, 'CLEAR_MARKED targetCount')
}

function validateScore(config: MissionConfig): void {
  if (config.type !== 'REACH_SCORE') throw new RangeError('Invalid REACH_SCORE configuration.')
  positiveScore(config.targetScore)
}

const definitions: readonly MissionDefinition[] = [
  {
    type: 'CLEAR_ALL_BUBBLES', name: 'Clear All Bubbles', supportedEvents: ['board-clear'], validate: validateClear,
    createInitial: (config, objectiveId, board, startingBubbleCount) => createProgress(config, objectiveId, 0, startingBubbleCount, { startingBubbleCount, remainingBubbleCount: board.size, clearedBubbleCount: 0 }),
    update: (config, previous, event) => {
      const remainingBubbleCount = event.board.size
      const startingBubbleCount = previous.startingBubbleCount ?? previous.target
      const clearedBubbleCount = Math.max(0, startingBubbleCount - remainingBubbleCount)
      return createProgress(config, previous.objectiveId, clearedBubbleCount, startingBubbleCount, { startingBubbleCount, remainingBubbleCount, clearedBubbleCount })
    },
  },
  {
    type: 'POP_COLOR', name: 'Pop Color', supportedEvents: ['direct-removal', 'floating-removal'], validate: validatePop,
    createInitial: (config, objectiveId) => { if (config.type !== 'POP_COLOR') throw new RangeError('Invalid POP_COLOR configuration.'); return createProgress(config, objectiveId, 0, config.targetCount, { color: config.targetColor }) },
    update: (config, previous, event) => { if (config.type !== 'POP_COLOR') throw new RangeError('Invalid POP_COLOR configuration.'); const removed = [...directRemoved(event.turn), ...floatingRemoved(event.turn)].filter((bubble) => bubble.color === config.targetColor).length; return createProgress(config, previous.objectiveId, countProgress(previous, removed, config.targetCount), config.targetCount, { color: config.targetColor }) },
  },
  {
    type: 'DROP_BUBBLES', name: 'Drop Bubbles', supportedEvents: ['floating-removal'], validate: validateDrop,
    createInitial: (config, objectiveId) => { if (config.type !== 'DROP_BUBBLES') throw new RangeError('Invalid DROP_BUBBLES configuration.'); return createProgress(config, objectiveId, 0, config.targetCount) },
    update: (config, previous, event) => { if (config.type !== 'DROP_BUBBLES') throw new RangeError('Invalid DROP_BUBBLES configuration.'); return createProgress(config, previous.objectiveId, countProgress(previous, event.turn.floating?.removedCount ?? 0, config.targetCount), config.targetCount) },
  },
  {
    type: 'CLEAR_MARKED', name: 'Clear Marked', supportedEvents: ['marked-removal'], validate: validateMarked,
    createInitial: (config, objectiveId) => { if (config.type !== 'CLEAR_MARKED') throw new RangeError('Invalid CLEAR_MARKED configuration.'); return createProgress(config, objectiveId, 0, config.targetCount) },
    update: (config, previous, event) => { if (config.type !== 'CLEAR_MARKED') throw new RangeError('Invalid CLEAR_MARKED configuration.'); const removed = [...directRemoved(event.turn), ...floatingRemoved(event.turn)].filter((bubble) => bubble.marked === true).length; return createProgress(config, previous.objectiveId, countProgress(previous, removed, config.targetCount), config.targetCount) },
  },
  {
    type: 'REACH_SCORE', name: 'Reach Score', supportedEvents: ['score'], validate: validateScore,
    createInitial: (config, objectiveId) => { if (config.type !== 'REACH_SCORE') throw new RangeError('Invalid REACH_SCORE configuration.'); return createProgress(config, objectiveId, 0, config.targetScore, { currentScore: 0 }) },
    update: (config, previous, event) => { if (config.type !== 'REACH_SCORE') throw new RangeError('Invalid REACH_SCORE configuration.'); return createProgress(config, previous.objectiveId, Math.max(0, event.currentScore), config.targetScore, { currentScore: Math.max(0, event.currentScore) }) },
  },
]

export const MISSION_REGISTRY: readonly MissionDefinition[] = Object.freeze(definitions)

function validateMissionRegistry(): void {
  const ids = new Set<string>()
  for (const definition of MISSION_REGISTRY) {
    if (ids.has(definition.type)) throw new RangeError(`Duplicate mission type ${definition.type}.`)
    ids.add(definition.type)
  }
}

export function validateMissionConfiguration(configuration: MissionConfiguration): void {
  const objectives = configuration.type === 'MISSION_SET' ? configuration.objectives : [configuration]
  if (objectives.length < 1 || objectives.length > 2) throw new RangeError('Mission sets must contain one or two mandatory objectives.')
  const types = new Set<MissionType>()
  for (const objective of objectives) {
    if (types.has(objective.type)) throw new RangeError(`Duplicate mission type ${objective.type} is not supported.`)
    types.add(objective.type)
    const definition = MISSION_REGISTRY.find((candidate) => candidate.type === objective.type)
    if (definition === undefined) throw new RangeError(`Unknown mission type ${objective.type}.`)
    definition.validate(objective)
  }
}

export function getMissionDefinition(type: string): MissionDefinition | null {
  return MISSION_REGISTRY.find((definition) => definition.type === type) ?? null
}

export function normalizeMissionObjectives(configuration: MissionConfiguration): readonly MissionConfig[] {
  validateMissionConfiguration(configuration)
  return configuration.type === 'MISSION_SET' ? [...configuration.objectives] : [configuration]
}

export function createMissionFeasibilityMetadata(config: MissionConfig): MissionFeasibilityMetadata {
  const definition = getMissionDefinition(config.type)
  if (definition === null) throw new RangeError(`Unknown mission type ${config.type}.`)
  definition.validate(config)
  return feasibility(config)
}

validateMissionRegistry()
