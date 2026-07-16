import type { Point2D } from '../../types/foundation'
import { getCellCenter } from '../grid/coordinates'
import type { HexBoard } from '../grid/HexBoard'
import type { GridCoordinate } from '../grid/types'
import type { ProjectileImpact } from '../physics/types'
import type { BubbleDescriptor } from '../shooter/types'

import { DEFAULT_SNAP_CONFIG } from './snapConfig'
import type {
  SnapCandidate,
  SnapCandidateSet,
  SnapConfig,
  SnapResult,
  SnappableImpact,
} from './types'

const SNAP_EPSILON = 1e-9

export function getSnapCandidates(
  board: HexBoard<BubbleDescriptor>,
  impact: ProjectileImpact,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
): SnapCandidateSet {
  validateSnapConfig(config)

  if (impact.type === 'ceiling') {
    const emptyTopRowCandidates = board
      .getValidCells()
      .filter((cell) => cell.coordinate.row === 0 && !cell.occupied)
      .map((cell) => toCandidate(cell.coordinate, cell.center, impact))

    // Prefer the ceiling rail while it has space. Once row 0 is full, keep
    // the same ceiling lane playable by attaching to the nearest supported
    // outer-frontier cell instead of discarding the fired bubble.
    if (emptyTopRowCandidates.length > 0) {
      return {
        impactType: impact.type,
        candidates: rankCandidates(emptyTopRowCandidates),
      }
    }

    return {
      impactType: impact.type,
      candidates: rankCeilingFrontierCandidates(
        getSupportedFrontierCandidates(board, impact),
        impact.position,
      ),
    }
  }

  if (impact.type === 'bubble') {
    if (impact.coordinate === undefined || !board.isValid(impact.coordinate)) {
      return { impactType: impact.type, candidates: [] }
    }

    const impactedCell = board.getOccupancy(impact.coordinate)
    if (impactedCell === undefined) {
      return { impactType: impact.type, candidates: [] }
    }

    const immediateCandidates = board
      .getNeighborCells(impact.coordinate)
      .filter((cell) => !cell.occupied)
      .map((cell) => toCandidate(cell.coordinate, cell.center, impact))

    return {
      impactType: impact.type,
      candidates: rankCandidates(
        immediateCandidates.length > 0
          ? immediateCandidates
          : getSupportedFrontierCandidates(board, impact),
      ),
    }
  }

  return { impactType: impact.type, candidates: [] }
}

export function resolveSnapAndPlace(
  board: HexBoard<BubbleDescriptor>,
  bubble: BubbleDescriptor,
  impact: ProjectileImpact,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
): SnapResult {
  const candidateSet = getSnapCandidates(board, impact, config)

  if (!isSnappableImpact(impact)) {
    return {
      ok: false,
      reason: 'unsupported-impact',
      impactType: impact.type,
      impactedCoordinate: undefined,
      candidates: candidateSet.candidates,
    }
  }

  if (
    impact.type === 'bubble' &&
    (impact.coordinate === undefined ||
      !board.isValid(impact.coordinate) ||
      board.getOccupancy(impact.coordinate) === undefined)
  ) {
    return {
      ok: false,
      reason: 'invalid-impact-coordinate',
      impactType: impact.type,
      impactedCoordinate: impact.coordinate,
      candidates: candidateSet.candidates,
    }
  }

  const candidate = candidateSet.candidates[0]
  if (candidate === undefined) {
    return {
      ok: false,
      reason: 'no-valid-candidate',
      impactType: impact.type,
      impactedCoordinate: impact.type === 'bubble' ? impact.coordinate : undefined,
      candidates: candidateSet.candidates,
    }
  }

  const placement = board.place(candidate.coordinate, bubble)
  if (!placement.ok) {
    return {
      ok: false,
      reason: 'placement-rejected',
      impactType: impact.type,
      impactedCoordinate: impact.type === 'bubble' ? impact.coordinate : undefined,
      candidates: candidateSet.candidates,
    }
  }

  return {
    ok: true,
    coordinate: candidate.coordinate,
    center: getCellCenter(board.config, candidate.coordinate),
    bubble,
    impactType: impact.type,
    impactedCoordinate: impact.type === 'bubble' ? impact.coordinate : undefined,
    candidates: candidateSet.candidates,
  }
}

function isSnappableImpact(impact: ProjectileImpact): impact is SnappableImpact {
  return impact.type === 'ceiling' || impact.type === 'bubble'
}

function toCandidate(
  coordinate: GridCoordinate,
  center: Point2D,
  impact: Pick<SnappableImpact, 'position' | 'direction'>,
): SnapCandidate {
  const distanceX = center.x - impact.position.x
  const distanceY = center.y - impact.position.y
  const distanceSquared = distanceX * distanceX + distanceY * distanceY
  const distance = Math.sqrt(distanceSquared)
  const approachAlignment = distance <= SNAP_EPSILON
    ? 0
    : (distanceX * -impact.direction.x + distanceY * -impact.direction.y) / distance

  return { coordinate, center, distanceSquared, approachAlignment }
}

function rankCandidates(candidates: SnapCandidate[]): SnapCandidate[] {
  return candidates.sort((first, second) => {
    const distanceDifference = first.distanceSquared - second.distanceSquared
    if (Math.abs(distanceDifference) > SNAP_EPSILON) {
      return distanceDifference
    }

    const alignmentDifference = second.approachAlignment - first.approachAlignment
    if (Math.abs(alignmentDifference) > SNAP_EPSILON) {
      return alignmentDifference
    }

    return (
      first.coordinate.row - second.coordinate.row ||
      first.coordinate.column - second.coordinate.column
    )
  })
}

function getSupportedFrontierCandidates(
  board: HexBoard<BubbleDescriptor>,
  impact: Pick<ProjectileImpact, 'position' | 'direction'>,
): SnapCandidate[] {
  return board
    .getValidCells()
    .filter(
      (cell) =>
        !cell.occupied &&
        board.getNeighbors(cell.coordinate).some((neighbor) => board.isOccupied(neighbor)),
    )
    .map((cell) => toCandidate(cell.coordinate, cell.center, impact))
}

function rankCeilingFrontierCandidates(
  candidates: SnapCandidate[],
  impactPosition: Point2D,
): SnapCandidate[] {
  return candidates.sort((first, second) => {
    const horizontalDifference =
      Math.abs(first.center.x - impactPosition.x) -
      Math.abs(second.center.x - impactPosition.x)
    if (Math.abs(horizontalDifference) > SNAP_EPSILON) {
      return horizontalDifference
    }

    const verticalDifference = first.center.y - second.center.y
    if (Math.abs(verticalDifference) > SNAP_EPSILON) {
      return verticalDifference
    }

    const distanceDifference = first.distanceSquared - second.distanceSquared
    if (Math.abs(distanceDifference) > SNAP_EPSILON) {
      return distanceDifference
    }

    return (
      first.coordinate.row - second.coordinate.row ||
      first.coordinate.column - second.coordinate.column
    )
  })
}

function validateSnapConfig(config: SnapConfig): void {
  if (
    !Number.isFinite(config.maxCeilingDistanceMultiplier) ||
    config.maxCeilingDistanceMultiplier <= 0
  ) {
    throw new RangeError('Snap ceiling distance multiplier must be greater than zero.')
  }
}
