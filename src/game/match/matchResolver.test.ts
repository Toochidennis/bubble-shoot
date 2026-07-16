import { describe, expect, it } from 'vitest'

import { HexBoard } from '../grid/HexBoard'
import { createHexGridConfig } from '../grid/gridConfig'
import type { GridCoordinate } from '../grid/types'
import { resolveSnapAndPlace } from '../snap/snapResolver'
import type { ProjectileImpact } from '../physics/types'
import type { BubbleColor, BubbleDescriptor } from '../shooter/types'
import { resolveMatch } from './matchResolver'

const config = createHexGridConfig({
  rowCount: 5,
  evenRowWidth: 5,
  oddRowWidth: 4,
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

describe('origin-anchored match resolution', () => {
  it('reports an isolated bubble below threshold without mutation', () => {
    const board = boardWith([[at(0, 0), 'blue']])
    const result = resolveMatch(board, at(0, 0))

    expect(result).toMatchObject({ ok: true, matched: false, clusterSize: 1 })
    expect(result.ok && result.removedCoordinates).toEqual([])
    expect(board.size).toBe(1)
  })

  it('keeps a connected pair and applies the exact threshold of three', () => {
    const pairBoard = boardWith([
      [at(0, 0), 'blue'],
      [at(0, 1), 'blue'],
    ])
    expect(resolveMatch(pairBoard, at(0, 0))).toMatchObject({ matched: false, clusterSize: 2 })
    expect(pairBoard.size).toBe(2)

    const tripleBoard = boardWith([
      [at(0, 0), 'blue'],
      [at(0, 1), 'blue'],
      [at(0, 2), 'blue'],
    ])
    const result = resolveMatch(tripleBoard, at(0, 0))
    expect(result).toMatchObject({ ok: true, matched: true, clusterSize: 3, color: 'blue' })
    expect(result.ok && result.removedCoordinates).toEqual([at(0, 0), at(0, 1), at(0, 2)])
    expect(tripleBoard.size).toBe(0)
  })

  it('traverses branches, odd/even rows, and board edges deterministically', () => {
    const board = boardWith([
      [at(0, 0), 'green'],
      [at(0, 1), 'green'],
      [at(1, 0), 'green'],
      [at(1, 1), 'green'],
      [at(2, 0), 'green'],
      [at(2, 1), 'green'],
    ])
    const result = resolveMatch(board, at(0, 0))
    expect(result).toMatchObject({ matched: true, clusterSize: 6 })
    expect(result.ok && result.cluster).toEqual([
      at(0, 0), at(0, 1), at(1, 0), at(1, 1), at(2, 0), at(2, 1),
    ])
    expect(board.size).toBe(0)
  })

  it('stops at mixed colors and ignores disconnected same-color bubbles', () => {
    const board = boardWith([
      [at(0, 0), 'red'],
      [at(0, 1), 'red'],
      [at(1, 0), 'yellow'],
      [at(3, 3), 'red'],
      [at(4, 0), 'red'],
    ])
    const result = resolveMatch(board, at(0, 0))
    expect(result).toMatchObject({ matched: false, clusterSize: 2 })
    expect(board.size).toBe(5)
    expect(board.isOccupied(at(3, 3))).toBe(true)
  })

  it('handles invalid and empty origins without changing occupancy', () => {
    const board = boardWith([[at(0, 0), 'purple']])
    expect(resolveMatch(board, at(99, 99))).toMatchObject({ ok: false, reason: 'invalid-origin' })
    expect(resolveMatch(board, at(0, 1))).toMatchObject({ ok: false, reason: 'empty-origin' })
    expect(board.size).toBe(1)
  })

  it('returns stable sorted output and removes each matched cell once', () => {
    const entries: Array<[GridCoordinate, BubbleColor]> = [
      [at(0, 2), 'purple'], [at(0, 0), 'purple'], [at(0, 1), 'purple'],
      [at(2, 2), 'blue'],
    ]
    const first = boardWith(entries)
    const second = boardWith([...entries].reverse())
    const firstResult = resolveMatch(first, at(0, 0))
    const secondResult = resolveMatch(second, at(0, 0))
    expect(firstResult).toEqual(secondResult)
    expect(firstResult.ok && firstResult.removedCoordinates).toEqual([at(0, 0), at(0, 1), at(0, 2)])
    expect(first.isOccupied(at(2, 2))).toBe(true)
  })

  it('does not emit a second removal event for an already-resolved origin', () => {
    const board = boardWith([
      [at(0, 0), 'yellow'],
      [at(0, 1), 'yellow'],
      [at(0, 2), 'yellow'],
    ])
    const first = resolveMatch(board, at(0, 0))
    const second = resolveMatch(board, at(0, 0))
    expect(first.ok && first.matched).toBe(true)
    expect(second).toMatchObject({ ok: false, reason: 'empty-origin', removedCoordinates: [] })
  })

  it('validates a custom threshold without changing traversal semantics', () => {
    const board = boardWith([
      [at(0, 0), 'green'],
      [at(0, 1), 'green'],
    ])
    const result = resolveMatch(board, at(0, 0), { threshold: 2 })
    expect(result).toMatchObject({ ok: true, matched: true, clusterSize: 2 })
    expect(board.size).toBe(0)
    expect(() => resolveMatch(board, at(0, 0), { threshold: 0 })).toThrow(RangeError)
  })

  it('integrates a successful Phase 5 snap and resolves only its origin cluster', () => {
    const board = boardWith([
      [at(0, 1), 'blue'],
      [at(0, 2), 'blue'],
      [at(3, 0), 'blue'],
    ])
    const impact: ProjectileImpact = {
      type: 'ceiling',
      position: { x: 0, y: 0 },
      direction: { x: 0, y: -1 },
      normal: { x: 0, y: 1 },
    }
    const snap = resolveSnapAndPlace(board, bubble('blue'), impact)
    expect(snap.ok).toBe(true)
    if (!snap.ok) return
    const result = resolveMatch(board, snap.coordinate)
    expect(result).toMatchObject({ ok: true, matched: true, clusterSize: 3 })
    expect(board.size).toBe(1)
    expect(board.isOccupied(at(3, 0))).toBe(true)
  })
})
