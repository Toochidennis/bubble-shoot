import type { HexBoard } from '../grid/HexBoard'
import type { BubbleDescriptor } from '../shooter/types'
import { getMissionDefinition, normalizeMissionObjectives } from './missionRegistry'
import type { MissionEvent } from './missionRegistry'
import type { MissionConfig, MissionObjectiveProgress, MissionSetProgress, MissionConfiguration } from './types'

function compareProgress(before: MissionObjectiveProgress, after: MissionObjectiveProgress): boolean {
  return before.progress !== after.progress || before.completed !== after.completed
}

export class MissionRuntime {
  private readonly objectives: readonly MissionConfig[]
  private states: readonly MissionObjectiveProgress[]
  private processedEventIds = new Set<string>()
  private currentProgress: MissionSetProgress

  public constructor(
    configuration: MissionConfiguration,
    board: HexBoard<BubbleDescriptor>,
    startingBubbleCount: number,
  ) {
    this.objectives = normalizeMissionObjectives(configuration)
    this.states = this.objectives.map((config, index) => {
      const definition = getMissionDefinition(config.type)
      if (definition === null) throw new RangeError(`Unknown mission type ${config.type}.`)
      return definition.createInitial(config, `objective-${index + 1}-${config.type}`, board, startingBubbleCount)
    })
    this.currentProgress = this.buildProgress([], [])
  }

  public get progress(): MissionSetProgress {
    return this.currentProgress
  }

  public update(event: MissionEvent): MissionSetProgress {
    if (this.processedEventIds.has(event.id)) {
      this.currentProgress = { ...this.currentProgress, changedObjectiveIds: [], completedObjectiveIds: [] }
      return this.currentProgress
    }
    this.processedEventIds.add(event.id)
    const changed: string[] = []
    const completed: string[] = []
    const nextStates = this.states.map((previous, index) => {
      const config = this.objectives[index]
      if (config === undefined) return previous
      const definition = getMissionDefinition(config.type)
      if (definition === null) return previous
      const next = definition.update(config, previous, event)
      if (compareProgress(previous, next)) changed.push(next.objectiveId)
      if (!previous.completed && next.completed) completed.push(next.objectiveId)
      return next
    })
    this.states = nextStates
    this.currentProgress = this.buildProgress(changed, completed)
    return this.currentProgress
  }

  private buildProgress(changedObjectiveIds: readonly string[], completedObjectiveIds: readonly string[]): MissionSetProgress {
    const first = this.states[0]
    const isSingle = this.objectives.length === 1
    return {
      type: isSingle && first !== undefined ? first.type : 'MISSION_SET',
      objectives: this.states,
      changedObjectiveIds: [...changedObjectiveIds],
      completedObjectiveIds: [...completedObjectiveIds],
      completed: this.states.length > 0 && this.states.every((state) => state.completed),
      startingBubbleCount: first?.startingBubbleCount ?? 0,
      remainingBubbleCount: first?.remainingBubbleCount ?? 0,
      clearedBubbleCount: first?.clearedBubbleCount ?? 0,
    }
  }
}

export function createMissionRuntime(
  configuration: MissionConfiguration,
  board: HexBoard<BubbleDescriptor>,
  startingBubbleCount: number,
): MissionRuntime {
  return new MissionRuntime(configuration, board, startingBubbleCount)
}
