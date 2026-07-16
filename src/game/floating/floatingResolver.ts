import { coordinateKey, getCellCenter } from '../grid/coordinates'
import type { HexBoard } from '../grid/HexBoard'
import type { GridCoordinate } from '../grid/types'
import type { BubbleDescriptor } from '../shooter/types'
import type {
  FloatingRemovalFailure,
  FloatingResolutionResult,
  RemovedFloatingBubble,
} from './types'

export function resolveFloatingBubbles(
  board: HexBoard<BubbleDescriptor>,
): FloatingResolutionResult {
  const supported = collectSupportedCoordinates(board)
  const supportedKeys = new Set(supported.map(coordinateKey))
  const occupied = board.getOccupiedCells().sort((first, second) => compareCoordinates(first.coordinate, second.coordinate))
  const floatingCoordinates = occupied
    .map((cell) => cell.coordinate)
    .filter((coordinate) => !supportedKeys.has(coordinateKey(coordinate)))
    .sort(compareCoordinates)

  const removedBubbles: RemovedFloatingBubble[] = []
  const removalFailures: FloatingRemovalFailure[] = []
  for (const coordinate of floatingCoordinates) {
    const bubble = board.getOccupancy(coordinate)
    const removal = board.remove(coordinate)
    if (!removal.ok) {
      removalFailures.push({ coordinate, reason: 'invalid-coordinate' })
      continue
    }
    if (bubble !== undefined) {
      removedBubbles.push({
        coordinate,
        center: getCellCenter(board.config, coordinate),
        bubble,
      })
    }
  }

  return {
    ok: removalFailures.length === 0,
    supportedCoordinates: supported,
    floatingCoordinates,
    removedBubbles,
    removalFailures,
    supportedCount: supported.length,
    floatingCount: floatingCoordinates.length,
    removedCount: removedBubbles.length,
    removedAny: removedBubbles.length > 0,
  }
}

function collectSupportedCoordinates(board: HexBoard<BubbleDescriptor>): GridCoordinate[] {
  const supported = new Set<string>()
  const supportedCoordinates: GridCoordinate[] = []
  const queue: GridCoordinate[] = board
    .getOccupiedTopRowCells()
    .map((cell) => cell.coordinate)
    .sort(compareCoordinates)
  let queueIndex = 0

  while (queueIndex < queue.length) {
    const coordinate = queue[queueIndex]
    queueIndex += 1
    if (coordinate === undefined) {
      continue
    }
    const key = coordinateKey(coordinate)
    if (supported.has(key) || !board.isOccupied(coordinate)) {
      continue
    }
    supported.add(key)
    supportedCoordinates.push(coordinate)
    for (const neighbor of board.getNeighbors(coordinate)) {
      if (!supported.has(coordinateKey(neighbor)) && board.isOccupied(neighbor)) {
        queue.push(neighbor)
      }
    }
  }

  return supportedCoordinates.sort(compareCoordinates)
}

function compareCoordinates(first: GridCoordinate, second: GridCoordinate): number {
  return first.row - second.row || first.column - second.column
}
