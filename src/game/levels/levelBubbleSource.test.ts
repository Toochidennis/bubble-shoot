import { describe, expect, it } from 'vitest'

import { HexBoard } from '../grid/HexBoard'
import { DEFAULT_HEX_GRID_CONFIG } from '../grid/gridConfig'
import { getCuratedLevel } from './curatedLevels'
import { LevelBubbleSource } from './levelBubbleSource'

describe('level-aware bubble source', () => {
  it('uses only remaining colors and resets deterministically', () => {
    const level = getCuratedLevel(1)
    if (level === undefined) throw new Error('Level 1 missing')
    const board = new HexBoard<{ color: 'blue' | 'green' | 'red' }>(DEFAULT_HEX_GRID_CONFIG)
    board.place({ row: 0, column: 0 }, { color: 'blue' })
    board.place({ row: 0, column: 1 }, { color: 'green' })
    const source = new LevelBubbleSource(level, board)
    expect([source.next().color, source.next().color]).toEqual(['blue', 'green'])
    board.remove({ row: 0, column: 0 })
    expect(source.next().color).toBe('green')
    source.reset()
    expect(source.next().color).toBe('green')
  })

  it('remains deterministic when two sources see identical boards', () => {
    const level = getCuratedLevel(6)
    if (level === undefined) throw new Error('Level 6 missing')
    const firstBoard = new HexBoard<{ color: 'blue' | 'green' | 'red' }>(DEFAULT_HEX_GRID_CONFIG)
    const secondBoard = new HexBoard<{ color: 'blue' | 'green' | 'red' }>(DEFAULT_HEX_GRID_CONFIG)
    firstBoard.place({ row: 0, column: 0 }, { color: 'blue' })
    secondBoard.place({ row: 0, column: 0 }, { color: 'blue' })
    const first = new LevelBubbleSource(level, firstBoard)
    const second = new LevelBubbleSource(level, secondBoard)
    expect([first.next(), first.next(), first.next()]).toEqual([second.next(), second.next(), second.next()])
  })
})
