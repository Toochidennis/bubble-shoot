import { coordinateKey, isValidCoordinate } from '../grid/coordinates'
import { getNeighborCoordinates } from '../grid/neighbors'
import type { HexGridConfig } from '../grid/gridConfig'
import type { GridCoordinate } from '../grid/types'
import { DEFAULT_SCORE_CONFIG } from '../scoring/scoreConfig'
import type { BubbleColor } from '../shooter/types'
import type { CuratedBubblePlacement } from '../levels/types'
import type { GeneratedBoardMetrics } from './types'

function rowWidth(config: HexGridConfig, row: number): number {
  return row % 2 === 0 ? config.evenRowWidth : config.oddRowWidth
}

function emptyCentralRegion(
  occupied: ReadonlySet<string>,
  depth: number,
  config: HexGridConfig,
): number {
  const eligible: GridCoordinate[] = []
  for (let row = 0; row < depth; row += 1) {
    for (let column = 1; column < rowWidth(config, row) - 1; column += 1) {
      const coordinate = { row, column }
      if (!occupied.has(coordinateKey(coordinate))) eligible.push(coordinate)
    }
  }
  const remaining = new Set(eligible.map(coordinateKey))
  let largest = 0
  for (const origin of eligible) {
    const originKey = coordinateKey(origin)
    if (!remaining.delete(originKey)) continue
    const queue = [origin]
    for (let index = 0; index < queue.length; index += 1) {
      for (const neighbor of getNeighborCoordinates(config, queue[index]!)) {
        if (remaining.delete(coordinateKey(neighbor))) queue.push(neighbor)
      }
    }
    largest = Math.max(largest, queue.length)
  }
  return largest
}

function sameColorClusters(
  placements: readonly CuratedBubblePlacement[],
  config: HexGridConfig,
): number[] {
  const colors = new Map(placements.map((bubble) => [coordinateKey(bubble.coordinate), bubble.color]))
  const remaining = new Set(colors.keys())
  const sizes: number[] = []
  for (const bubble of placements) {
    const key = coordinateKey(bubble.coordinate)
    if (!remaining.delete(key)) continue
    const queue = [bubble.coordinate]
    for (let index = 0; index < queue.length; index += 1) {
      for (const neighbor of getNeighborCoordinates(config, queue[index]!)) {
        const neighborKey = coordinateKey(neighbor)
        if (remaining.has(neighborKey) && colors.get(neighborKey) === bubble.color) {
          remaining.delete(neighborKey)
          queue.push(neighbor)
        }
      }
    }
    sizes.push(queue.length)
  }
  return sizes
}

function validatedDropOpportunity(
  coordinates: readonly GridCoordinate[],
  config: HexGridConfig,
): number {
  const ceiling = '__ceiling__'
  const coordinateByKey = new Map(coordinates.map((coordinate) => [coordinateKey(coordinate), coordinate]))
  const adjacency = new Map<string, string[]>()
  adjacency.set(ceiling, coordinates.filter((coordinate) => coordinate.row === 0).map(coordinateKey))
  for (const coordinate of coordinates) {
    const key = coordinateKey(coordinate)
    const neighbors = getNeighborCoordinates(config, coordinate)
      .map(coordinateKey)
      .filter((neighborKey) => coordinateByKey.has(neighborKey))
    if (coordinate.row === 0) neighbors.push(ceiling)
    adjacency.set(key, neighbors)
  }
  const discovery = new Map<string, number>()
  const low = new Map<string, number>()
  const parent = new Map<string, string>()
  const subtreeSize = new Map<string, number>()
  const detachable = new Map<string, number>()
  let time = 0

  const visit = (key: string): void => {
    time += 1
    discovery.set(key, time)
    low.set(key, time)
    subtreeSize.set(key, key === ceiling ? 0 : 1)
    for (const neighbor of adjacency.get(key) ?? []) {
      if (!discovery.has(neighbor)) {
        parent.set(neighbor, key)
        visit(neighbor)
        subtreeSize.set(key, (subtreeSize.get(key) ?? 0) + (subtreeSize.get(neighbor) ?? 0))
        low.set(key, Math.min(low.get(key)!, low.get(neighbor)!))
        if (key !== ceiling && low.get(neighbor)! >= discovery.get(key)!) {
          detachable.set(key, (detachable.get(key) ?? 0) + (subtreeSize.get(neighbor) ?? 0))
        }
      } else if (parent.get(key) !== neighbor) {
        low.set(key, Math.min(low.get(key)!, discovery.get(neighbor)!))
      }
    }
  }
  visit(ceiling)
  return Math.max(0, ...coordinates.filter((coordinate) => coordinate.row > 0).map((coordinate) => detachable.get(coordinateKey(coordinate)) ?? 0))
}

export function analyzeGeneratedBoard(
  config: HexGridConfig,
  placements: readonly CuratedBubblePlacement[],
): GeneratedBoardMetrics & { readonly colorCounts: Readonly<Record<BubbleColor, number>> } {
  const coordinates = placements.map((bubble) => bubble.coordinate).filter((coordinate) => isValidCoordinate(config, coordinate))
  const occupied = new Set(coordinates.map(coordinateKey))
  const depth = coordinates.reduce((maximum, coordinate) => Math.max(maximum, coordinate.row + 1), 0)
  const validGridCapacity = Array.from({ length: config.rowCount }, (_, row) => rowWidth(config, row)).reduce((sum, width) => sum + width, 0)
  const intendedRegionCapacity = Array.from({ length: depth }, (_, row) => rowWidth(config, row)).reduce((sum, width) => sum + width, 0)
  const upperRows = Math.min(3, Math.max(1, depth))
  const upperCapacity = Array.from({ length: upperRows }, (_, row) => rowWidth(config, row)).reduce((sum, width) => sum + width, 0)
  const upperOccupied = coordinates.filter((coordinate) => coordinate.row < upperRows).length
  const normalizedXs = coordinates.map((coordinate) => coordinate.column + (coordinate.row % 2 === 0 ? 0 : .5))
  const clusters = sameColorClusters(placements, config)
  const dropOpportunity = validatedDropOpportunity(coordinates, config)
  const colorCounts = { blue: 0, green: 0, purple: 0, red: 0, yellow: 0 } satisfies Record<BubbleColor, number>
  for (const bubble of placements) colorCounts[bubble.color] += 1
  return {
    validGridCapacity,
    intendedRegionCapacity,
    occupiedCellCount: occupied.size,
    occupancyRatio: intendedRegionCapacity === 0 ? 0 : occupied.size / intendedRegionCapacity,
    occupiedRowCount: new Set(coordinates.map((coordinate) => coordinate.row)).size,
    upperRowOccupancy: upperCapacity === 0 ? 0 : upperOccupied / upperCapacity,
    largestEmptyCentralRegion: emptyCentralRegion(occupied, depth, config),
    formationWidth: normalizedXs.length === 0 ? 0 : Math.max(...normalizedXs) - Math.min(...normalizedXs) + 1,
    formationDepth: depth,
    averageSameColorClusterSize: clusters.length === 0 ? 0 : clusters.reduce((sum, size) => sum + size, 0) / clusters.length,
    largestSameColorClusterSize: Math.max(0, ...clusters),
    validatedDropOpportunity: dropOpportunity,
    conservativeScoreFloor: occupied.size * DEFAULT_SCORE_CONFIG.pointsPerMatchedBubble,
    colorCounts: Object.freeze(colorCounts),
  }
}
