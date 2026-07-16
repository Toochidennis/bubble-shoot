import { describe, expect, it } from 'vitest'
import { detectEmptyBoardMissionInvariant } from './levelInvariant'
import type { MissionSetProgress } from '../mission/types'
import { LevelSession } from './LevelSession'
import { createGameplayLayout } from '../layout/gameplayLayout'
import { getOccupiedBubbleColliders } from '../physics/collisionQueries'

const incomplete: MissionSetProgress = {
  type: 'REACH_SCORE',
  objectives: [],
  changedObjectiveIds: [],
  completedObjectiveIds: [],
  completed: false,
  startingBubbleCount: 50,
  remainingBubbleCount: 0,
  clearedBubbleCount: 50,
}

describe('generated empty-board mission invariant', () => {
  it('surfaces complete diagnostic context without fabricating a win or progress', () => {
    const diagnostic = detectEmptyBoardMissionInvariant({
      contentSource: 'generated',
      boardSize: 0,
      levelId: 31,
      missionDefinition: { type: 'REACH_SCORE', targetScore: 500 },
      missionProgress: incomplete,
      startingBubbleCount: 50,
      processedTurnNumber: 12,
    })
    expect(diagnostic).toMatchObject({
      type: 'EMPTY_BOARD_INCOMPLETE_MISSION',
      levelId: 31,
      startingBubbleCount: 50,
      processedTurnNumber: 12,
      missionProgress: { completed: false },
    })
  })

  it('does not flag curated, non-empty, or completed generated states', () => {
    expect(detectEmptyBoardMissionInvariant({ contentSource: 'curated', boardSize: 0, levelId: 1, missionDefinition: { type: 'CLEAR_ALL_BUBBLES' }, missionProgress: incomplete, startingBubbleCount: 20, processedTurnNumber: 1 })).toBeNull()
    expect(detectEmptyBoardMissionInvariant({ contentSource: 'generated', boardSize: 1, levelId: 16, missionDefinition: { type: 'CLEAR_ALL_BUBBLES' }, missionProgress: incomplete, startingBubbleCount: 45, processedTurnNumber: 1 })).toBeNull()
    expect(detectEmptyBoardMissionInvariant({ contentSource: 'generated', boardSize: 0, levelId: 16, missionDefinition: { type: 'CLEAR_ALL_BUBBLES' }, missionProgress: { ...incomplete, completed: true }, startingBubbleCount: 45, processedTurnNumber: 1 })).toBeNull()
  })

  it('stops a stable generated turn without falsely winning when the board empties before its score mission', () => {
    const viewport = { width: 320, height: 640, pixelRatio: 1 }
    const layout = createGameplayLayout(viewport)
    const session = new LevelSession(1, viewport, undefined, layout)
    expect(session.loadDevelopmentLevel(20)).toEqual({ ok: true })
    expect(session.activeLevel.mission.type).toBe('REACH_SCORE')
    for (const cell of session.gameplay.board.getOccupiedCells()) session.gameplay.board.remove(cell.coordinate)
    const color = session.gameplay.currentBubble.color
    session.gameplay.board.place({ row: 0, column: 5 }, { color })
    session.gameplay.board.place({ row: 0, column: 6 }, { color })
    const origin = session.gameplay.shooter.snapshot().origin
    expect(session.requestFire(origin)).toEqual({ accepted: true })
    for (let index = 0; index < 100 && session.gameplay.state === 'SHOOTING'; index += 1) {
      session.step(0.05, {
        bounds: { leftWallX: 0, rightWallX: viewport.width, topY: layout.boardCeilingY },
        bubbles: getOccupiedBubbleColliders(session.gameplay.board, layout.projectile.radius),
      })
    }
    const snapshot = session.snapshot()
    expect(session.gameplay.board.size).toBe(0)
    expect(snapshot.mission.completed).toBe(false)
    expect(snapshot.status).toBe('LOST')
    expect(snapshot.earnedStars).toBe(0)
    expect(snapshot.contentInvariant).toMatchObject({
      type: 'EMPTY_BOARD_INCOMPLETE_MISSION',
      levelId: 20,
      processedTurnNumber: 1,
    })
  })
})
