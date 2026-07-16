import { describe, expect, it } from 'vitest'
import { normalizeMissionObjectives } from '../mission/missionRegistry'
import type { MissionConfig, MissionConfiguration } from '../mission/types'
import { analyzeGeneratedBoard } from './analysis'
import { generateGeneratedLevel } from './generator'
import type { GeneratedLevelDefinition } from './types'
import { missionCompletesOnBoardExhaustion, validateGeneratedLevel } from './validator'

function findLevelWith(type: MissionConfig['type']): GeneratedLevelDefinition {
  for (let levelId = 16; levelId <= 400; levelId += 1) {
    const result = generateGeneratedLevel(levelId)
    if (result.ok && normalizeMissionObjectives(result.level.mission).some((objective) => objective.type === type)) return result.level
  }
  throw new Error(`Expected a generated ${type} mission.`)
}

type MutableGeneratedLevel = Omit<GeneratedLevelDefinition, 'mission' | 'shotLimit'> & {
  mission: MissionConfiguration
  shotLimit: number
}

function mutableClone(level: GeneratedLevelDefinition): MutableGeneratedLevel {
  return structuredClone(level) as MutableGeneratedLevel
}

describe('generated mission feasibility and exhaustion safety', () => {
  it.each(['POP_COLOR', 'CLEAR_MARKED', 'REACH_SCORE'] as const)('derives %s only from analyzed board feasibility', (type) => {
    const level = findLevelWith(type)
    const analysis = analyzeGeneratedBoard(level.gridConfig, level.startingBubbles)
    const objective = normalizeMissionObjectives(level.mission).find((candidate) => candidate.type === type)
    expect(objective).toBeDefined()
    if (objective?.type === 'POP_COLOR') expect(objective.targetCount).toBeLessThanOrEqual(analysis.colorCounts[objective.targetColor])
    if (objective?.type === 'CLEAR_MARKED') expect(objective.targetCount).toBeLessThanOrEqual(level.startingBubbles.filter((bubble) => bubble.marked).length)
    if (objective?.type === 'REACH_SCORE') expect(objective.targetScore).toBeLessThanOrEqual(analysis.conservativeScoreFloor)
    if (objective?.type === 'DROP_BUBBLES') {
      expect(analysis.validatedDropOpportunity).toBeGreaterThan(0)
      expect(objective.targetCount).toBeLessThanOrEqual(analysis.validatedDropOpportunity)
    }
    expect(missionCompletesOnBoardExhaustion(level.mission, analysis, level.startingBubbles.filter((bubble) => bubble.marked).length)).toBe(true)
  })

  it('does not fabricate DROP_BUBBLES when full generated boards have no detachable topology', () => {
    for (let levelId = 16; levelId <= 120; levelId += 1) {
      const result = generateGeneratedLevel(levelId)
      expect(result.ok).toBe(true)
      if (!result.ok) continue
      const analysis = analyzeGeneratedBoard(result.level.gridConfig, result.level.startingBubbles)
      const dropObjective = normalizeMissionObjectives(result.level.mission).find((objective) => objective.type === 'DROP_BUBBLES')
      if (dropObjective?.type === 'DROP_BUBBLES') {
        expect(analysis.validatedDropOpportunity).toBeGreaterThan(0)
        expect(dropObjective.targetCount).toBeLessThanOrEqual(analysis.validatedDropOpportunity)
      }
    }
  }, 20_000)

  it('rejects impossible mission targets and incompatible mission-set effort', () => {
    const popLevel = mutableClone(findLevelWith('POP_COLOR'))
    const popObjective = normalizeMissionObjectives(popLevel.mission).find((objective) => objective.type === 'POP_COLOR')
    if (popObjective?.type !== 'POP_COLOR') throw new Error('Expected POP_COLOR objective.')
    popLevel.mission = { type: 'POP_COLOR', targetColor: popObjective.targetColor, targetCount: popLevel.startingBubbles.length + 1 }
    expect(validateGeneratedLevel(popLevel)).toMatchObject({ ok: false })

    const dropLevel = mutableClone(findLevelWith('POP_COLOR'))
    dropLevel.mission = { type: 'DROP_BUBBLES', targetCount: dropLevel.generator.boardMetrics.validatedDropOpportunity + 1 }
    expect(validateGeneratedLevel(dropLevel)).toMatchObject({ ok: false })

    const setLevel = mutableClone(findLevelWith('POP_COLOR'))
    setLevel.mission = {
      type: 'MISSION_SET',
      objectives: [
        { type: 'POP_COLOR', targetColor: popObjective.targetColor, targetCount: Math.max(1, Math.floor(setLevel.startingBubbles.length / 2)) },
        { type: 'REACH_SCORE', targetScore: setLevel.generator.boardMetrics.conservativeScoreFloor },
      ],
    }
    setLevel.shotLimit = 8
    const validation = validateGeneratedLevel(setLevel)
    expect(validation.ok).toBe(false)
    if (!validation.ok) expect(validation.errors).toContain('mission-set combined effort exceeds shot allowance')
  })
})
