import { coordinateKey } from '../grid/coordinates'
import type { HexBoard } from '../grid/HexBoard'
import type { GridCoordinate } from '../grid/types'
import type { BubbleDescriptor } from '../shooter/types'
import { DEFAULT_MATCH_CONFIG } from './matchConfig'
import type { MatchConfig, MatchResult } from './types'

export function resolveMatch(
  board: HexBoard<BubbleDescriptor>,
  origin: GridCoordinate,
  config: MatchConfig = DEFAULT_MATCH_CONFIG,
): MatchResult {
  validateConfig(config)

  if (!board.isValid(origin)) {
    return {
      ok: false,
      matched: false,
      reason: 'invalid-origin',
      origin,
      cluster: [],
      removedCoordinates: [],
      removedBubbles: [],
    }
  }

  const originBubble = board.getOccupancy(origin)
  if (originBubble === undefined) {
    return {
      ok: false,
      matched: false,
      reason: 'empty-origin',
      origin,
      cluster: [],
      removedCoordinates: [],
      removedBubbles: [],
    }
  }

  const cluster = collectConnectedCluster(board, origin, originBubble)
  const matched = cluster.length >= config.threshold
  const removedCoordinates: GridCoordinate[] = []
  const removedBubbles: import('./types').RemovedMatchBubble[] = []

  if (matched) {
    for (const coordinate of cluster) {
      const removal = board.remove(coordinate)
      if (removal.ok && removal.value !== undefined) {
        removedCoordinates.push(coordinate)
        removedBubbles.push({ coordinate, bubble: removal.value })
      }
    }
  }

  return {
    ok: true,
    matched,
    origin,
    bubble: originBubble,
    color: originBubble.color,
    cluster,
    clusterSize: cluster.length,
    removedCoordinates,
    removedBubbles,
  }
}

function collectConnectedCluster(
  board: HexBoard<BubbleDescriptor>,
  origin: GridCoordinate,
  originBubble: BubbleDescriptor,
): GridCoordinate[] {
  const visited = new Set<string>()
  const queue: GridCoordinate[] = [origin]
  const cluster: GridCoordinate[] = []
  let queueIndex = 0

  while (queueIndex < queue.length) {
    const coordinate = queue[queueIndex]
    queueIndex += 1
    if (coordinate === undefined) {
      continue
    }
    const key = coordinateKey(coordinate)
    if (visited.has(key)) {
      continue
    }
    visited.add(key)

    const bubble = board.getOccupancy(coordinate)
    if (bubble === undefined || bubble.color !== originBubble.color) {
      continue
    }

    cluster.push(coordinate)
    for (const neighbor of board.getNeighbors(coordinate)) {
      if (!visited.has(coordinateKey(neighbor))) {
        queue.push(neighbor)
      }
    }
  }

  return cluster.sort(compareCoordinates)
}

function compareCoordinates(first: GridCoordinate, second: GridCoordinate): number {
  return first.row - second.row || first.column - second.column
}

function validateConfig(config: MatchConfig): void {
  if (!Number.isSafeInteger(config.threshold) || config.threshold < 1) {
    throw new RangeError('Match threshold must be a positive safe integer.')
  }
}
