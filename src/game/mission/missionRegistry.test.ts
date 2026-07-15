import { describe, expect, it } from 'vitest'
import { HexBoard } from '../grid/HexBoard'
import { DEFAULT_HEX_GRID_CONFIG } from '../grid/gridConfig'
import { resolveMatch } from '../match/matchResolver'
import type { TurnResult } from '../session/types'
import type { BubbleDescriptor } from '../shooter/types'
import { createMissionRuntime } from './missionRuntime'
import { getMissionDefinition, MISSION_REGISTRY, validateMissionConfiguration } from './missionRegistry'
import type { MissionConfiguration } from './types'

const board = () => new HexBoard<BubbleDescriptor>(DEFAULT_HEX_GRID_CONFIG)
const bubble = (color: 'blue' | 'green' | 'purple' | 'red' | 'yellow', marked = false) => marked ? { color, marked: true } : { color }

function turn(overrides: Partial<TurnResult> = {}): TurnResult {
  return {
    turnNumber: 1,
    startingState: 'AIMING',
    finalState: 'AIMING',
    firedBubble: bubble('blue'),
    impact: null,
    terminalProjectile: null,
    snap: null,
    match: null,
    floating: null,
    completed: true,
    reason: 'completed',
    ...overrides,
  }
}

function event(overrides: Partial<TurnResult> = {}, currentScore = 0) {
  return { id: 'turn:1', turn: turn(overrides), board: board(), currentScore }
}

describe('mission registry', () => {
  it('registers all five approved mission types in stable order', () => {
    expect(MISSION_REGISTRY.map((definition) => definition.type)).toEqual(['CLEAR_ALL_BUBBLES', 'POP_COLOR', 'DROP_BUBBLES', 'CLEAR_MARKED', 'REACH_SCORE'])
    expect(new Set(MISSION_REGISTRY.map((definition) => definition.type)).size).toBe(5)
    expect(getMissionDefinition('UNKNOWN')).toBeNull()
  })

  it('counts POP_COLOR direct and floating target removals once and clamps at target', () => {
    const runtime = createMissionRuntime({ type: 'POP_COLOR', targetColor: 'red', targetCount: 2 }, board(), 0)
    const result = runtime.update(event({
      match: { ok: true, matched: true, origin: { row: 0, column: 0 }, bubble: bubble('red'), color: 'red', cluster: [], clusterSize: 1, removedCoordinates: [{ row: 0, column: 0 }], removedBubbles: [{ coordinate: { row: 0, column: 0 }, bubble: bubble('red') }] },
      floating: { ok: true, supportedCoordinates: [], floatingCoordinates: [], removedBubbles: [{ coordinate: { row: 1, column: 0 }, center: { x: 0, y: 0 }, bubble: bubble('red') }, { coordinate: { row: 1, column: 1 }, center: { x: 0, y: 0 }, bubble: bubble('green') }], removalFailures: [], supportedCount: 0, floatingCount: 2, removedCount: 2, removedAny: true },
    }))
    expect(result.objectives[0]?.progress).toBe(2)
    expect(result.objectives[0]?.completed).toBe(true)
    expect(runtime.update(event({ turnNumber: 1 })).objectives[0]?.progress).toBe(2)
  })

  it('counts DROP_BUBBLES only from floating removal', () => {
    const runtime = createMissionRuntime({ type: 'DROP_BUBBLES', targetCount: 2 }, board(), 0)
    const directOnly = runtime.update(event({ match: { ok: true, matched: true, origin: { row: 0, column: 0 }, bubble: bubble('blue'), color: 'blue', cluster: [], clusterSize: 1, removedCoordinates: [{ row: 0, column: 0 }], removedBubbles: [{ coordinate: { row: 0, column: 0 }, bubble: bubble('blue') }] } }))
    expect(directOnly.objectives[0]?.progress).toBe(0)
    const dropped = runtime.update({ ...event({ turnNumber: 2, floating: { ok: true, supportedCoordinates: [], floatingCoordinates: [], removedBubbles: [{ coordinate: { row: 1, column: 0 }, center: { x: 0, y: 0 }, bubble: bubble('blue') }, { coordinate: { row: 1, column: 1 }, center: { x: 0, y: 0 }, bubble: bubble('green') }], removalFailures: [], supportedCount: 0, floatingCount: 2, removedCount: 2, removedAny: true } }), id: 'turn:2' })
    expect(dropped.objectives[0]?.completed).toBe(true)
  })

  it('counts marked removals without changing color identity or matching semantics', () => {
    const runtime = createMissionRuntime({ type: 'CLEAR_MARKED', targetCount: 2 }, board(), 0)
    const result = runtime.update(event({ match: { ok: true, matched: true, origin: { row: 0, column: 0 }, bubble: bubble('blue', true), color: 'blue', cluster: [], clusterSize: 1, removedCoordinates: [{ row: 0, column: 0 }], removedBubbles: [{ coordinate: { row: 0, column: 0 }, bubble: bubble('blue', true) }] }, floating: { ok: true, supportedCoordinates: [], floatingCoordinates: [], removedBubbles: [{ coordinate: { row: 1, column: 0 }, center: { x: 0, y: 0 }, bubble: bubble('green', true) }, { coordinate: { row: 1, column: 1 }, center: { x: 0, y: 0 }, bubble: bubble('red') }], removalFailures: [], supportedCount: 0, floatingCount: 2, removedCount: 2, removedAny: true } }))
    expect(result.objectives[0]?.progress).toBe(2)
    expect(result.objectives[0]?.completed).toBe(true)
  })

  it('observes authoritative score for REACH_SCORE without adding score itself', () => {
    const runtime = createMissionRuntime({ type: 'REACH_SCORE', targetScore: 100 }, board(), 0)
    expect(runtime.update(event({}, 99)).objectives[0]?.completed).toBe(false)
    expect(runtime.update({ ...event({ turnNumber: 2 }, 150), id: 'turn:2' }).objectives[0]).toMatchObject({ currentScore: 150, progress: 100, completed: true })
  })

  it('requires every objective in a one-or-two objective set', () => {
    const config: MissionConfiguration = { type: 'MISSION_SET', objectives: [{ type: 'POP_COLOR', targetColor: 'red', targetCount: 1 }, { type: 'DROP_BUBBLES', targetCount: 1 }] }
    const runtime = createMissionRuntime(config, board(), 0)
    expect(runtime.progress.completed).toBe(false)
    expect(() => validateMissionConfiguration({ type: 'MISSION_SET', objectives: [] })).toThrow()
    expect(() => validateMissionConfiguration({ type: 'MISSION_SET', objectives: [{ type: 'CLEAR_ALL_BUBBLES' }, { type: 'REACH_SCORE', targetScore: 1 }, { type: 'DROP_BUBBLES', targetCount: 1 }] })).toThrow()
    expect(() => validateMissionConfiguration({ type: 'MISSION_SET', objectives: [{ type: 'DROP_BUBBLES', targetCount: 1 }, { type: 'DROP_BUBBLES', targetCount: 2 }] })).toThrow()
    expect(runtime.progress.objectives).toHaveLength(2)
    const completed = runtime.update({
      ...event({
        match: { ok: true, matched: true, origin: { row: 0, column: 0 }, bubble: bubble('red'), color: 'red', cluster: [], clusterSize: 1, removedCoordinates: [{ row: 0, column: 0 }], removedBubbles: [{ coordinate: { row: 0, column: 0 }, bubble: bubble('red') }] },
        floating: { ok: true, supportedCoordinates: [], floatingCoordinates: [], removedBubbles: [{ coordinate: { row: 1, column: 0 }, center: { x: 0, y: 0 }, bubble: bubble('blue') }], removalFailures: [], supportedCount: 0, floatingCount: 1, removedCount: 1, removedAny: true },
      }),
      id: 'turn:2',
    })
    expect(completed.completed).toBe(true)
    expect(completed.completedObjectiveIds).toHaveLength(2)
  })

  it('keeps Clear All board semantics and color matching unchanged when marked metadata is present', () => {
    const clearBoard = board()
    clearBoard.place({ row: 0, column: 0 }, bubble('blue', true))
    clearBoard.place({ row: 0, column: 1 }, bubble('blue'))
    clearBoard.place({ row: 0, column: 2 }, bubble('blue'))
    const match = resolveMatch(clearBoard, { row: 0, column: 1 })
    expect(match.ok && match.matched).toBe(true)
    const runtime = createMissionRuntime({ type: 'CLEAR_ALL_BUBBLES' }, board(), 0)
    expect(runtime.update(event({}, 0)).completed).toBe(true)
  })
})
