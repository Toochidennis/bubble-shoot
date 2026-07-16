import { coordinateKey } from '../grid/coordinates'
import { getNeighborCoordinates } from '../grid/neighbors'
import type { HexGridConfig } from '../grid/gridConfig'
import type { GridCoordinate } from '../grid/types'
import type { BubbleColor } from '../shooter/types'
import { createSeededRandom } from '../../utils/seededRandom'

export const COLOR_COMPOSITION_IDS = [
  'ORGANIC_CLUSTERS',
  'WAVES',
  'SPIRAL_FLOW',
  'COLOR_RINGS',
  'MIRRORED_WINGS',
  'FLAME_FLOW',
  'ZIGZAG_FLOW',
  'DIAGONAL_FLOW',
  'COLOR_CORE',
  'SPLIT_TONES',
] as const

export type ColorCompositionId = typeof COLOR_COMPOSITION_IDS[number]

function stylePhase(style: ColorCompositionId, coordinate: GridCoordinate, paletteSize: number): number {
  const { row, column } = coordinate
  const center = 3
  switch (style) {
    case 'ORGANIC_CLUSTERS': return Math.floor(row / 2) + Math.floor(column / 2)
    case 'WAVES': return row + Math.floor((column + (row % 2)) / 3)
    case 'SPIRAL_FLOW': return Math.floor(Math.hypot(column - center, row - 4)) + Math.floor(Math.atan2(row - 4, column - center) * 2)
    case 'COLOR_RINGS': return Math.floor(Math.hypot(column - center, row - 4))
    case 'MIRRORED_WINGS': return Math.abs(column - center) + Math.floor(row / 2)
    case 'FLAME_FLOW': return Math.abs(column - center) + row + (row % 3)
    case 'ZIGZAG_FLOW': return row + Math.floor((column + (row % 2 === 0 ? 0 : 2)) / 2)
    case 'DIAGONAL_FLOW': return row + column
    case 'COLOR_CORE': return Math.floor(Math.hypot(column - center, row - 3) * 1.4)
    case 'SPLIT_TONES': return (column < center ? 0 : Math.max(1, Math.floor(paletteSize / 2))) + Math.floor(row / 3)
  }
}

function connectedAssignedSize(
  coordinate: GridCoordinate,
  color: BubbleColor,
  assigned: ReadonlyMap<string, BubbleColor>,
  config: HexGridConfig,
): number {
  const queue = getNeighborCoordinates(config, coordinate).filter((neighbor) => assigned.get(coordinateKey(neighbor)) === color)
  const visited = new Set(queue.map(coordinateKey))
  for (let index = 0; index < queue.length; index += 1) {
    for (const neighbor of getNeighborCoordinates(config, queue[index]!)) {
      const key = coordinateKey(neighbor)
      if (!visited.has(key) && assigned.get(key) === color) {
        visited.add(key)
        queue.push(neighbor)
      }
    }
  }
  return visited.size
}

export function selectColorComposition(seed: string): ColorCompositionId {
  const rng = createSeededRandom(`${seed}|composition`)
  return COLOR_COMPOSITION_IDS[rng.integer(0, COLOR_COMPOSITION_IDS.length)]!
}

export function composeBubbleColors(
  coordinates: readonly GridCoordinate[],
  palette: readonly BubbleColor[],
  style: ColorCompositionId,
  config: HexGridConfig,
  seed: string,
): ReadonlyMap<string, BubbleColor> {
  if (palette.length === 0) throw new RangeError('Color composition requires a non-empty palette.')
  const rng = createSeededRandom(`${seed}|composition:${style}`)
  const assigned = new Map<string, BubbleColor>()
  const ordered = [...coordinates].sort((a, b) => a.row - b.row || a.column - b.column)

  for (const coordinate of ordered) {
    const neighbors = getNeighborCoordinates(config, coordinate)
      .map((neighbor) => assigned.get(coordinateKey(neighbor)))
      .filter((color): color is BubbleColor => color !== undefined)
    let index = Math.abs(stylePhase(style, coordinate, palette.length)) % palette.length
    if (neighbors.length > 0 && rng.next() < 0.62) {
      const preferred = neighbors[rng.integer(0, neighbors.length)]!
      index = palette.indexOf(preferred)
    }

    let color = palette[Math.max(0, index)]!
    for (let attempt = 0; attempt < palette.length; attempt += 1) {
      if (connectedAssignedSize(coordinate, color, assigned, config) < 5) break
      color = palette[(Math.max(0, index) + attempt + 1) % palette.length]!
    }
    assigned.set(coordinateKey(coordinate), color)
  }

  return assigned
}

