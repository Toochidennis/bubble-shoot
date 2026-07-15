import { describe, expect, it } from 'vitest'

import { HexBoard } from './HexBoard'
import {
  coordinateKey,
  getCellCenter,
  getRowWidth,
  isValidCoordinate,
  worldToNearestCell,
} from './coordinates'
import { createHexGridConfig } from './gridConfig'
import { getNeighborCoordinates } from './neighbors'
import type { GridCoordinate } from './types'

const TEST_CONFIG = createHexGridConfig({
  rowCount: 3,
  evenRowWidth: 7,
  oddRowWidth: 6,
  bubbleRadius: 10,
  offsetRowParity: 'odd',
  origin: { x: 5, y: 7 },
})

const FULL_NEIGHBOR_CONFIG = createHexGridConfig({
  rowCount: 4,
  evenRowWidth: 7,
  oddRowWidth: 6,
  bubbleRadius: 10,
})

const coordinate = (row: number, column: number): GridCoordinate => ({
  row,
  column,
})

describe('hex-grid geometry', () => {
  it('uses stable keys, row widths, and deterministic centers', () => {
    expect(coordinateKey(coordinate(2, 4))).toBe('2:4')
    expect(getRowWidth(TEST_CONFIG, 0)).toBe(7)
    expect(getRowWidth(TEST_CONFIG, 1)).toBe(6)
    expect(getCellCenter(TEST_CONFIG, coordinate(0, 0))).toEqual({ x: 5, y: 7 })
    expect(getCellCenter(TEST_CONFIG, coordinate(0, 2))).toEqual({ x: 45, y: 7 })
    expect(getCellCenter(TEST_CONFIG, coordinate(1, 0))).toEqual({
      x: 15,
      y: 7 + Math.sqrt(3) * 10,
    })
  })

  it('keeps horizontal spacing and offset-row spacing consistent', () => {
    const rowZeroFirst = getCellCenter(TEST_CONFIG, coordinate(0, 0))
    const rowZeroSecond = getCellCenter(TEST_CONFIG, coordinate(0, 1))
    const rowOneFirst = getCellCenter(TEST_CONFIG, coordinate(1, 0))

    expect(rowZeroSecond.x - rowZeroFirst.x).toBe(TEST_CONFIG.horizontalSpacing)
    expect(rowOneFirst.x - rowZeroFirst.x).toBe(TEST_CONFIG.rowOffset)
    expect(rowOneFirst.y - rowZeroFirst.y).toBe(TEST_CONFIG.verticalSpacing)
  })

  it('maps a world point to the nearest valid cell deterministically', () => {
    const target = coordinate(1, 3)
    const center = getCellCenter(TEST_CONFIG, target)

    expect(worldToNearestCell(TEST_CONFIG, center)).toEqual(target)
    expect(
      worldToNearestCell(TEST_CONFIG, {
        x: center.x + 2,
        y: center.y + 2,
      }),
    ).toEqual(target)
  })
})

describe('hex-grid bounds', () => {
  it('accepts valid coordinates and rejects invalid rows and columns', () => {
    expect(isValidCoordinate(TEST_CONFIG, coordinate(0, 0))).toBe(true)
    expect(isValidCoordinate(TEST_CONFIG, coordinate(1, 5))).toBe(true)
    expect(isValidCoordinate(TEST_CONFIG, coordinate(-1, 0))).toBe(false)
    expect(isValidCoordinate(TEST_CONFIG, coordinate(3, 0))).toBe(false)
    expect(isValidCoordinate(TEST_CONFIG, coordinate(1, 6))).toBe(false)
    expect(isValidCoordinate(TEST_CONFIG, coordinate(0, 7))).toBe(false)
    expect(isValidCoordinate(TEST_CONFIG, { row: 0.5, column: 0 })).toBe(false)
  })

  it('reports the expected number of valid cells for alternating row widths', () => {
    const board = new HexBoard<string>(TEST_CONFIG)

    expect(board.getValidCells()).toHaveLength(20)
    expect(board.getValidCells().every((cell) => cell.occupied === false)).toBe(true)
  })
})

describe('six-neighbor lookup', () => {
  it('maps an interior even row to the correct six neighbors', () => {
    expect(getNeighborCoordinates(FULL_NEIGHBOR_CONFIG, coordinate(2, 3))).toEqual([
      coordinate(2, 2),
      coordinate(2, 4),
      coordinate(1, 2),
      coordinate(1, 3),
      coordinate(3, 2),
      coordinate(3, 3),
    ])
  })

  it('maps an interior odd row to the correct six neighbors', () => {
    expect(getNeighborCoordinates(TEST_CONFIG, coordinate(1, 2))).toEqual([
      coordinate(1, 1),
      coordinate(1, 3),
      coordinate(0, 2),
      coordinate(0, 3),
      coordinate(2, 2),
      coordinate(2, 3),
    ])
  })

  it('clips top, bottom, left, and right boundary neighbors', () => {
    expect(getNeighborCoordinates(TEST_CONFIG, coordinate(0, 0))).toEqual([
      coordinate(0, 1),
      coordinate(1, 0),
    ])
    expect(getNeighborCoordinates(TEST_CONFIG, coordinate(2, 6))).toEqual([
      coordinate(2, 5),
      coordinate(1, 5),
    ])
    expect(getNeighborCoordinates(TEST_CONFIG, coordinate(1, 0))).toEqual([
      coordinate(1, 1),
      coordinate(0, 0),
      coordinate(0, 1),
      coordinate(2, 0),
      coordinate(2, 1),
    ])
    expect(getNeighborCoordinates(TEST_CONFIG, coordinate(1, 5))).toEqual([
      coordinate(1, 4),
      coordinate(0, 5),
      coordinate(0, 6),
      coordinate(2, 5),
      coordinate(2, 6),
    ])
  })

  it('never returns duplicate or invalid neighbors', () => {
    const neighbors = getNeighborCoordinates(TEST_CONFIG, coordinate(1, 0))
    const keys = neighbors.map(coordinateKey)

    expect(new Set(keys).size).toBe(keys.length)
    expect(neighbors.every((neighbor) => isValidCoordinate(TEST_CONFIG, neighbor))).toBe(
      true,
    )
    expect(getNeighborCoordinates(TEST_CONFIG, coordinate(99, 99))).toEqual([])
  })
})

describe('hex-board occupancy', () => {
  it('supports empty, placement, retrieval, removal, and overwrite protection', () => {
    const board = new HexBoard<string>(TEST_CONFIG)
    const target = coordinate(1, 2)

    expect(board.isOccupied(target)).toBe(false)
    expect(board.getOccupancy(target)).toBeUndefined()
    expect(board.place(target, 'bubble-a')).toEqual({ ok: true, value: undefined })
    expect(board.isOccupied(target)).toBe(true)
    expect(board.getOccupancy(target)).toBe('bubble-a')
    expect(board.place(target, 'bubble-b')).toEqual({ ok: false, reason: 'occupied' })
    expect(board.getOccupancy(target)).toBe('bubble-a')
    expect(board.remove(target)).toEqual({ ok: true, value: 'bubble-a' })
    expect(board.isOccupied(target)).toBe(false)
    expect(board.remove(target)).toEqual({ ok: true, value: undefined })
  })

  it('rejects invalid placement without mutating board state', () => {
    const board = new HexBoard<string>(TEST_CONFIG)
    const result = board.place(coordinate(1, 6), 'invalid')

    expect(result).toEqual({ ok: false, reason: 'invalid-coordinate' })
    expect(board.size).toBe(0)
    expect(() => board.isOccupied(coordinate(1, 6))).toThrow(RangeError)
    expect(board.remove(coordinate(1, 6))).toEqual({
      ok: false,
      reason: 'invalid-coordinate',
    })
  })

  it('enumerates occupied cells and top-row occupancy', () => {
    const board = new HexBoard<string>(TEST_CONFIG)

    board.place(coordinate(0, 1), 'top')
    board.place(coordinate(1, 2), 'middle')

    expect(board.getOccupiedCells().map((cell) => cell.key)).toEqual(['0:1', '1:2'])
    expect(board.getOccupiedTopRowCells().map((cell) => cell.key)).toEqual(['0:1'])
    expect(board.isTopRow(coordinate(0, 1))).toBe(true)
    expect(board.isTopRow(coordinate(1, 2))).toBe(false)
    expect(board.getNeighborCells(coordinate(0, 1))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: '0:0' }),
        expect.objectContaining({ key: '0:2' }),
      ]),
    )
  })

  it('reports an empty top-row foundation', () => {
    const board = new HexBoard<string>(TEST_CONFIG)

    expect(board.getOccupiedTopRowCells()).toEqual([])
  })
})
