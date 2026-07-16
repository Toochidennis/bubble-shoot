import type { HexGridConfig } from '../grid/gridConfig'
import type { GridCoordinate } from '../grid/types'
import { createSeededRandom } from '../../utils/seededRandom'

export interface GeneratedBubbleCountBand {
  readonly minimum: number
  readonly maximum: number
}

export interface GeneratedBoardShape {
  readonly coordinates: readonly GridCoordinate[]
  readonly targetBubbleCount: number
  readonly intendedRegionCapacity: number
}

export function getGeneratedBubbleCountBand(levelId: number): GeneratedBubbleCountBand {
  if (levelId <= 100) return { minimum: 59, maximum: 110 }
  if (levelId <= 1_000) return { minimum: 76, maximum: 140 }
  if (levelId <= 5_000) return { minimum: 96, maximum: 175 }
  return { minimum: 116, maximum: 200 }
}

function rowWidth(config: HexGridConfig, row: number): number {
  return row % 2 === 0 ? config.evenRowWidth : config.oddRowWidth
}

export function buildGeneratedBoardShape(
  levelId: number,
  config: HexGridConfig,
  templateCoordinates: readonly GridCoordinate[],
  _templateId: string,
  seed: string,
): GeneratedBoardShape {
  const band = getGeneratedBubbleCountBand(levelId)
  const rng = createSeededRandom(`${seed}|shape`)
  const validCapacity = Array.from({ length: config.rowCount }, (_, row) => rowWidth(config, row)).reduce((sum, width) => sum + width, 0)
  const minimum = Math.min(validCapacity, band.minimum)
  const maximum = Math.min(validCapacity, band.maximum)
  const targetBubbleCount = rng.integer(minimum, maximum + 1)
  let depth = 0
  let intendedRegionCapacity = 0
  while (depth < config.rowCount && intendedRegionCapacity < targetBubbleCount) {
    intendedRegionCapacity += rowWidth(config, depth)
    depth += 1
  }

  const retained = new Map<string, GridCoordinate>()
  let remaining = targetBubbleCount
  for (let row = 0; row < depth; row += 1) {
    const width = rowWidth(config, row)
    const count = Math.min(width, remaining)
    const anchorColumns = templateCoordinates
      .filter((coordinate) => coordinate.row === row)
      .map((coordinate) => coordinate.column)
      .sort((a, b) => a - b)
    const columns = new Set<number>()
    if (count === width) {
      for (let column = 0; column < width; column += 1) columns.add(column)
    } else {
      const start = Math.floor((width - count) / 2)
      for (let offset = 0; offset < count; offset += 1) columns.add(start + offset)
      for (const column of anchorColumns) {
        if (columns.size >= count) break
        columns.add(column)
      }
      while (columns.size > count) {
        const ordered = [...columns].sort((a, b) => Math.abs(b - (width - 1) / 2) - Math.abs(a - (width - 1) / 2) || b - a)
        const removable = ordered.find((column) => !anchorColumns.includes(column))
        if (removable === undefined) break
        columns.delete(removable)
      }
    }
    for (const column of [...columns].sort((a, b) => a - b)) {
      retained.set(`${row}:${column}`, { row, column })
    }
    remaining -= count
  }

  if (retained.size !== targetBubbleCount) {
    throw new Error(`Unable to transform generated board to ${targetBubbleCount} supported cells.`)
  }
  return {
    coordinates: Object.freeze([...retained.values()].sort((a, b) => a.row - b.row || a.column - b.column)),
    targetBubbleCount,
    intendedRegionCapacity,
  }
}
