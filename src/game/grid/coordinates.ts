import type { Point2D } from '../../types/foundation'

import type { HexGridConfig } from './gridConfig'
import type { GridCoordinate } from './types'

export function coordinateKey(coordinate: GridCoordinate): string {
  return `${coordinate.row}:${coordinate.column}`
}

export function getRowWidth(config: HexGridConfig, row: number): number {
  return row % 2 === 0 ? config.evenRowWidth : config.oddRowWidth
}

export function isValidCoordinate(
  config: HexGridConfig,
  coordinate: GridCoordinate,
): boolean {
  return (
    Number.isSafeInteger(coordinate.row) &&
    Number.isSafeInteger(coordinate.column) &&
    coordinate.row >= 0 &&
    coordinate.row < config.rowCount &&
    coordinate.column >= 0 &&
    coordinate.column < getRowWidth(config, coordinate.row)
  )
}

export function assertValidCoordinate(
  config: HexGridConfig,
  coordinate: GridCoordinate,
): void {
  if (!isValidCoordinate(config, coordinate)) {
    throw new RangeError(
      `Invalid hex-grid coordinate (${coordinate.row}, ${coordinate.column}).`,
    )
  }
}

export function getCellCenter(
  config: HexGridConfig,
  coordinate: GridCoordinate,
): Point2D {
  assertValidCoordinate(config, coordinate)

  const isOffsetRow =
    coordinate.row % 2 === (config.offsetRowParity === 'odd' ? 1 : 0)

  return {
    x:
      config.origin.x +
      coordinate.column * config.horizontalSpacing +
      (isOffsetRow ? config.rowOffset : 0),
    y: config.origin.y + coordinate.row * config.verticalSpacing,
  }
}

export function worldToNearestCell(
  config: HexGridConfig,
  point: Point2D,
): GridCoordinate | undefined {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new TypeError('World point coordinates must be finite numbers.')
  }

  const estimatedRow = Math.round(
    (point.y - config.origin.y) / config.verticalSpacing,
  )
  const candidates: GridCoordinate[] = []

  for (let row = estimatedRow - 1; row <= estimatedRow + 1; row += 1) {
    if (row < 0 || row >= config.rowCount) {
      continue
    }

    const isOffsetRow =
      row % 2 === (config.offsetRowParity === 'odd' ? 1 : 0)
    const rowOriginX = config.origin.x + (isOffsetRow ? config.rowOffset : 0)
    const estimatedColumn = Math.round(
      (point.x - rowOriginX) / config.horizontalSpacing,
    )

    for (
      let column = estimatedColumn - 1;
      column <= estimatedColumn + 1;
      column += 1
    ) {
      const candidate = { row, column }

      if (isValidCoordinate(config, candidate)) {
        candidates.push(candidate)
      }
    }
  }

  candidates.sort((first, second) => {
    const firstCenter = getCellCenter(config, first)
    const secondCenter = getCellCenter(config, second)
    const firstDistance = squaredDistance(point, firstCenter)
    const secondDistance = squaredDistance(point, secondCenter)

    return (
      firstDistance - secondDistance ||
      first.row - second.row ||
      first.column - second.column
    )
  })

  return candidates[0]
}

function squaredDistance(first: Point2D, second: Point2D): number {
  const deltaX = first.x - second.x
  const deltaY = first.y - second.y
  return deltaX * deltaX + deltaY * deltaY
}

