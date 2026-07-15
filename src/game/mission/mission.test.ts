import { describe, expect, it } from 'vitest'

import { HexBoard } from '../grid/HexBoard'
import { createHexGridConfig } from '../grid/gridConfig'
import type { BubbleDescriptor } from '../shooter/types'
import { evaluateClearAllMission } from './types'

const config = createHexGridConfig({ rowCount: 8, evenRowWidth: 4, oddRowWidth: 4, bubbleRadius: 10 })

describe('CLEAR_ALL_BUBBLES mission', () => {
  it('initializes and derives progress from logical occupancy', () => {
    const board = new HexBoard<BubbleDescriptor>(config)
    board.place({ row: 0, column: 0 }, { color: 'blue' })
    board.place({ row: 0, column: 1 }, { color: 'green' })
    expect(evaluateClearAllMission(board, 2)).toEqual({
      type: 'CLEAR_ALL_BUBBLES', startingBubbleCount: 2, remainingBubbleCount: 2,
      clearedBubbleCount: 0, completed: false,
    })
    board.remove({ row: 0, column: 0 })
    expect(evaluateClearAllMission(board, 2)).toMatchObject({ remainingBubbleCount: 1, clearedBubbleCount: 1, completed: false })
    board.remove({ row: 0, column: 1 })
    expect(evaluateClearAllMission(board, 2)).toMatchObject({ remainingBubbleCount: 0, clearedBubbleCount: 2, completed: true })
  })

  it('clamps net cleared progress when the board grows beyond its starting size', () => {
    const board = new HexBoard<BubbleDescriptor>(config)
    for (let index = 0; index < 21; index += 1) {
      board.place({ row: Math.floor(index / 4), column: index % 4 }, { color: 'blue' })
    }

    expect(evaluateClearAllMission(board, 20)).toMatchObject({
      remainingBubbleCount: 21,
      clearedBubbleCount: 0,
      completed: false,
    })

    board.place({ row: 5, column: 1 }, { color: 'green' })
    board.place({ row: 5, column: 2 }, { color: 'red' })
    expect(evaluateClearAllMission(board, 20).clearedBubbleCount).toBe(0)

    for (const coordinate of [
      { row: 0, column: 0 },
      { row: 0, column: 1 },
      { row: 0, column: 2 },
      { row: 0, column: 3 },
      { row: 1, column: 0 },
    ]) {
      board.remove(coordinate)
    }
    expect(evaluateClearAllMission(board, 20)).toMatchObject({
      remainingBubbleCount: 18,
      clearedBubbleCount: 2,
      completed: false,
    })
  })

  it('reports the full starting count as cleared for an empty board', () => {
    const board = new HexBoard<BubbleDescriptor>(config)
    const result = evaluateClearAllMission(board, 20)
    expect(result).toMatchObject({
      remainingBubbleCount: 0,
      clearedBubbleCount: 20,
      completed: true,
    })
  })
})
