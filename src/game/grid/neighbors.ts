import { coordinateKey, isValidCoordinate } from './coordinates'
import type { HexGridConfig } from './gridConfig'
import type { GridCoordinate } from './types'

/**
 * Neighbor order is left, right, up-left, up-right, down-left, down-right.
 * Odd rows are offset right, so an even row maps diagonals to c-1/c and an
 * odd row maps diagonals to c/c+1.
 */
export function getNeighborCoordinates(
  config: HexGridConfig,
  coordinate: GridCoordinate,
): GridCoordinate[] {
  if (!isValidCoordinate(config, coordinate)) {
    return []
  }

  const isUnshiftedRow =
    coordinate.row % 2 === (config.offsetRowParity === 'odd' ? 0 : 1)
  const firstDiagonalColumn = coordinate.column + (isUnshiftedRow ? -1 : 0)
  const secondDiagonalColumn = coordinate.column + (isUnshiftedRow ? 0 : 1)
  const candidates: GridCoordinate[] = [
    { row: coordinate.row, column: coordinate.column - 1 },
    { row: coordinate.row, column: coordinate.column + 1 },
    { row: coordinate.row - 1, column: firstDiagonalColumn },
    { row: coordinate.row - 1, column: secondDiagonalColumn },
    { row: coordinate.row + 1, column: firstDiagonalColumn },
    { row: coordinate.row + 1, column: secondDiagonalColumn },
  ]
  const seen = new Set<string>()

  return candidates.filter((neighbor) => {
    if (!isValidCoordinate(config, neighbor)) {
      return false
    }

    const key = coordinateKey(neighbor)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}
