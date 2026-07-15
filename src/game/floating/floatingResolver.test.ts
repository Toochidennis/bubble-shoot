import { describe, expect, it } from 'vitest'

import { HexBoard } from '../grid/HexBoard'
import { createHexGridConfig } from '../grid/gridConfig'
import type { GridCoordinate } from '../grid/types'
import { resolveMatch } from '../match/matchResolver'
import type { BubbleColor, BubbleDescriptor } from '../shooter/types'
import { resolveFloatingBubbles } from './floatingResolver'

const config = createHexGridConfig({
  rowCount: 6,
  evenRowWidth: 6,
  oddRowWidth: 5,
  bubbleRadius: 10,
  origin: { x: 0, y: 0 },
})
const at = (row: number, column: number): GridCoordinate => ({ row, column })
const bubble = (color: BubbleColor): BubbleDescriptor => ({ color })

function boardWith(entries: Array<[GridCoordinate, BubbleColor]>): HexBoard<BubbleDescriptor> {
  const board = new HexBoard<BubbleDescriptor>(config)
  for (const [coordinate, color] of entries) {
    expect(board.place(coordinate, bubble(color)).ok).toBe(true)
  }
  return board
}

describe('floating bubble resolution', () => {
  it('supports a single top-row root and a vertical staggered chain', () => {
    const board = boardWith([
      [at(0, 0), 'blue'],
      [at(1, 0), 'red'],
      [at(2, 0), 'green'],
    ])
    const result = resolveFloatingBubbles(board)
    expect(result.supportedCoordinates).toEqual([at(0, 0), at(1, 0), at(2, 0)])
    expect(result.floatingCoordinates).toEqual([])
    expect(result.removedAny).toBe(false)
    expect(board.size).toBe(3)
  })

  it('supports branching clusters, mixed colors, and edge connections regardless of color', () => {
    const board = boardWith([
      [at(0, 2), 'blue'],
      [at(1, 1), 'red'],
      [at(1, 2), 'green'],
      [at(2, 1), 'purple'],
      [at(2, 2), 'yellow'],
    ])
    const result = resolveFloatingBubbles(board)
    expect(result.floatingCount).toBe(0)
    expect(result.supportedCount).toBe(5)
  })

  it('keeps multiple independent ceiling-supported roots', () => {
    const board = boardWith([
      [at(0, 0), 'blue'],
      [at(1, 0), 'blue'],
      [at(0, 5), 'red'],
      [at(1, 4), 'green'],
      [at(3, 3), 'yellow'],
    ])
    const result = resolveFloatingBubbles(board)
    expect(result.supportedCoordinates).toEqual([
      at(0, 0), at(0, 5), at(1, 0), at(1, 4),
    ])
    expect(result.floatingCoordinates).toEqual([at(3, 3)])
    expect(result.removedBubbles[0]?.bubble).toEqual(bubble('yellow'))
    expect(board.size).toBe(4)
  })

  it('removes all occupied cells when no top-row root exists', () => {
    const board = boardWith([
      [at(2, 0), 'blue'],
      [at(2, 1), 'blue'],
      [at(4, 4), 'red'],
    ])
    const result = resolveFloatingBubbles(board)
    expect(result.supportedCoordinates).toEqual([])
    expect(result.floatingCoordinates).toEqual([at(2, 0), at(2, 1), at(4, 4)])
    expect(result.removedCount).toBe(3)
    expect(board.size).toBe(0)
  })

  it('handles an empty board without mutation', () => {
    const board = new HexBoard<BubbleDescriptor>(config)
    const result = resolveFloatingBubbles(board)
    expect(result).toMatchObject({ supportedCount: 0, floatingCount: 0, removedCount: 0, removedAny: false, ok: true })
    expect(board.size).toBe(0)
  })

  it('removes a large floating cluster exactly once and preserves supported bubbles', () => {
    const board = boardWith([
      [at(0, 2), 'blue'],
      [at(1, 2), 'blue'],
      [at(3, 2), 'red'],
      [at(3, 3), 'green'],
      [at(4, 2), 'yellow'],
      [at(4, 3), 'purple'],
    ])
    const result = resolveFloatingBubbles(board)
    expect(result.floatingCoordinates).toEqual([
      at(3, 2), at(3, 3), at(4, 2), at(4, 3),
    ])
    expect(result.removedCount).toBe(4)
    expect(board.size).toBe(2)
    expect(board.isOccupied(at(0, 2))).toBe(true)
    expect(board.isOccupied(at(1, 2))).toBe(true)
  })

  it('is deterministic for identical boards and returns stable coordinate ordering', () => {
    const entries: Array<[GridCoordinate, BubbleColor]> = [
      [at(3, 2), 'red'], [at(0, 0), 'blue'], [at(4, 1), 'green'],
      [at(0, 5), 'yellow'], [at(1, 4), 'purple'],
    ]
    const first = resolveFloatingBubbles(boardWith(entries))
    const second = resolveFloatingBubbles(boardWith([...entries].reverse()))
    expect(first).toEqual(second)
  })

  it('integrates after Phase 6 match removal and removes the disconnected bridge cluster', () => {
    const board = boardWith([
      [at(0, 0), 'blue'],
      [at(0, 1), 'blue'],
      [at(1, 0), 'blue'],
      [at(1, 1), 'red'],
      [at(2, 1), 'red'],
      [at(3, 1), 'red'],
    ])
    const match = resolveMatch(board, at(0, 1))
    expect(match).toMatchObject({ ok: true, matched: true })
    const result = resolveFloatingBubbles(board)
    expect(result.floatingCoordinates).toEqual([at(1, 1), at(2, 1), at(3, 1)])
    expect(result.removedCount).toBe(3)
    expect(board.size).toBe(0)
  })

  it('removes a mixed-color hanging cluster after a one-cell match bridge is cut', () => {
    const board = boardWith([
      [at(0, 1), 'red'], [at(0, 2), 'red'], [at(0, 3), 'red'],
      [at(1, 1), 'blue'], [at(1, 2), 'blue'], [at(1, 3), 'blue'],
      [at(2, 2), 'green'], [at(3, 2), 'yellow'], [at(3, 3), 'purple'],
      [at(4, 2), 'red'],
    ])
    const match = resolveMatch(board, at(1, 2))
    expect(match).toMatchObject({ ok: true, matched: true, clusterSize: 3 })
    const result = resolveFloatingBubbles(board)
    expect(result.floatingCoordinates).toEqual([at(2, 2), at(3, 2), at(3, 3), at(4, 2)])
    expect(result.removedBubbles).toHaveLength(4)
    expect(board.getOccupiedTopRowCells()).toHaveLength(3)
  })

  it('keeps a two-cell bridge supported until the alternate path is removed', () => {
    const board = boardWith([
      [at(0, 1), 'blue'], [at(0, 2), 'blue'],
      [at(1, 1), 'red'], [at(1, 2), 'green'],
      [at(2, 1), 'yellow'], [at(2, 2), 'purple'],
      [at(3, 1), 'green'],
    ])
    board.remove(at(1, 1))
    expect(resolveFloatingBubbles(board).floatingCount).toBe(0)
    board.remove(at(1, 2))
    const result = resolveFloatingBubbles(board)
    expect(result.floatingCoordinates).toEqual([at(2, 1), at(2, 2), at(3, 1)])
  })

  it('drops only the independent branch whose diagonal support chain is cut', () => {
    const board = boardWith([
      [at(0, 0), 'blue'], [at(0, 5), 'red'],
      [at(1, 0), 'green'], [at(1, 4), 'yellow'],
      [at(2, 0), 'purple'], [at(2, 4), 'red'],
      [at(3, 0), 'green'], [at(3, 4), 'yellow'],
    ])
    board.remove(at(1, 4))
    const result = resolveFloatingBubbles(board)
    expect(result.floatingCoordinates).toEqual([at(2, 4), at(3, 4)])
    expect(result.supportedCoordinates).toEqual([at(0, 0), at(0, 5), at(1, 0), at(2, 0), at(3, 0)])
  })

  it('does not remove supported bubbles when no floating cells exist', () => {
    const board = boardWith([
      [at(0, 0), 'blue'],
      [at(1, 0), 'red'],
      [at(1, 1), 'green'],
    ])
    const before = board.size
    const result = resolveFloatingBubbles(board)
    expect(result.removedBubbles).toEqual([])
    expect(board.size).toBe(before)
  })
})
