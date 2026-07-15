import type { Point2D } from '../../types/foundation'

import { normalizeDirection } from './aimMath'

const EPSILON = 1e-9

export interface TrajectoryBounds {
  readonly leftWallX: number
  readonly rightWallX: number
  readonly topY: number
  readonly maxDistance: number
  readonly maxSegments: number
}

export type TrajectoryHit =
  | 'left-wall'
  | 'right-wall'
  | 'top-boundary'
  | 'max-distance'

export interface TrajectorySegment {
  readonly start: Point2D
  readonly end: Point2D
  readonly distance: number
  readonly hit: TrajectoryHit
}

export interface TrajectoryPreview {
  readonly segments: TrajectorySegment[]
  readonly endPoint: Point2D
  readonly totalDistance: number
  readonly endReason: TrajectoryHit | 'segment-limit'
}

export function predictTrajectory(
  origin: Point2D,
  direction: Point2D,
  bounds: TrajectoryBounds,
): TrajectoryPreview {
  validateTrajectoryInputs(origin, bounds)

  const normalized = normalizeDirection(direction)

  if (normalized.y >= -EPSILON) {
    throw new RangeError('Trajectory direction must point into the upward hemisphere.')
  }

  const segments: TrajectorySegment[] = []
  let current = { ...origin }
  let ray = normalized
  let totalDistance = 0
  let endReason: TrajectoryPreview['endReason'] = 'segment-limit'

  for (let index = 0; index < bounds.maxSegments; index += 1) {
    const remainingDistance = bounds.maxDistance - totalDistance
    const wallDistance = getWallDistance(current, ray, bounds)
    const topDistance = (bounds.topY - current.y) / ray.y
    const segmentDistance = Math.min(remainingDistance, wallDistance, topDistance)
    const end = {
      x: current.x + ray.x * segmentDistance,
      y: current.y + ray.y * segmentDistance,
    }
    const hitsTop = topDistance <= remainingDistance + EPSILON && topDistance <= wallDistance + EPSILON
    const hitsWall = wallDistance <= remainingDistance + EPSILON && wallDistance < topDistance - EPSILON
    const hit: TrajectoryHit = hitsTop
      ? 'top-boundary'
      : hitsWall
        ? ray.x < 0
          ? 'left-wall'
          : 'right-wall'
        : 'max-distance'

    segments.push({
      start: current,
      end,
      distance: segmentDistance,
      hit,
    })
    totalDistance += segmentDistance
    current = end

    if (hit === 'top-boundary' || hit === 'max-distance') {
      endReason = hit
      break
    }

    ray = { x: -ray.x, y: ray.y }
  }

  return {
    segments,
    endPoint: current,
    totalDistance,
    endReason,
  }
}

function getWallDistance(
  point: Point2D,
  direction: Point2D,
  bounds: TrajectoryBounds,
): number {
  if (direction.x < -EPSILON) {
    return (bounds.leftWallX - point.x) / direction.x
  }

  if (direction.x > EPSILON) {
    return (bounds.rightWallX - point.x) / direction.x
  }

  return Number.POSITIVE_INFINITY
}

function validateTrajectoryInputs(
  origin: Point2D,
  bounds: TrajectoryBounds,
): void {
  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y)) {
    throw new TypeError('Trajectory origin must contain finite coordinates.')
  }

  if (
    !Number.isFinite(bounds.leftWallX) ||
    !Number.isFinite(bounds.rightWallX) ||
    !Number.isFinite(bounds.topY) ||
    bounds.leftWallX >= bounds.rightWallX ||
    origin.x < bounds.leftWallX ||
    origin.x > bounds.rightWallX ||
    bounds.topY > origin.y ||
    !Number.isFinite(bounds.maxDistance) ||
    bounds.maxDistance <= 0 ||
    !Number.isSafeInteger(bounds.maxSegments) ||
    bounds.maxSegments <= 0
  ) {
    throw new RangeError('Trajectory bounds are invalid.')
  }
}

