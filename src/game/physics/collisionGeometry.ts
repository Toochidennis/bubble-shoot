import type { Point2D } from '../../types/foundation'

import { PHYSICS_EPSILON } from './physicsConfig'
import type { ProjectileBounds, ProjectileConfig } from './types'

export interface WallCandidate {
  readonly distance: number
  readonly wall: 'left' | 'right'
  readonly position: Point2D
  readonly normal: Point2D
}

export interface CeilingCandidate {
  readonly distance: number
  readonly position: Point2D
}

export interface CircleCandidate {
  readonly distance: number
  readonly position: Point2D
  readonly normal: Point2D
}

export function getPlayableWallX(
  bounds: ProjectileBounds,
  config: ProjectileConfig,
): { readonly left: number; readonly right: number } {
  const left = bounds.leftWallX + config.radius
  const right = bounds.rightWallX - config.radius
  if (!Number.isFinite(left) || !Number.isFinite(right) || left >= right) {
    throw new RangeError('Projectile wall bounds must contain the projectile radius.')
  }
  return { left, right }
}

export function findWallCandidate(
  position: Point2D,
  direction: Point2D,
  remainingDistance: number,
  bounds: ProjectileBounds,
  config: ProjectileConfig,
): WallCandidate | null {
  const walls = getPlayableWallX(bounds, config)
  if (direction.x < -PHYSICS_EPSILON) {
    return createWallCandidate(
      (walls.left - position.x) / direction.x,
      'left',
      walls.left,
      position,
      direction,
      remainingDistance,
      { x: 1, y: 0 },
    )
  }
  if (direction.x > PHYSICS_EPSILON) {
    return createWallCandidate(
      (walls.right - position.x) / direction.x,
      'right',
      walls.right,
      position,
      direction,
      remainingDistance,
      { x: -1, y: 0 },
    )
  }
  return null
}

export function findCeilingCandidate(
  position: Point2D,
  direction: Point2D,
  remainingDistance: number,
  bounds: ProjectileBounds,
  config: ProjectileConfig,
): CeilingCandidate | null {
  if (direction.y >= -PHYSICS_EPSILON) {
    return null
  }
  const ceilingY = bounds.topY + config.radius
  const distance = (ceilingY - position.y) / direction.y
  if (distance < -PHYSICS_EPSILON || distance > remainingDistance + PHYSICS_EPSILON) {
    return null
  }
  const safeDistance = Math.max(0, distance)
  return {
    distance: safeDistance,
    position: {
      x: position.x + direction.x * safeDistance,
      y: ceilingY,
    },
  }
}

export function findCircleCandidate(
  position: Point2D,
  direction: Point2D,
  remainingDistance: number,
  center: Point2D,
  combinedRadius: number,
): CircleCandidate | null {
  if (!Number.isFinite(combinedRadius) || combinedRadius <= 0) {
    throw new RangeError('Combined collision radius must be greater than zero.')
  }

  const offset = { x: position.x - center.x, y: position.y - center.y }
  const c = offset.x * offset.x + offset.y * offset.y - combinedRadius * combinedRadius
  if (c <= PHYSICS_EPSILON) {
    return {
      distance: 0,
      position: { x: position.x, y: position.y },
      normal: normalizeOrUp(offset),
    }
  }

  const projection = offset.x * direction.x + offset.y * direction.y
  if (projection >= 0) {
    return null
  }

  const discriminant = projection * projection - c
  if (discriminant < -PHYSICS_EPSILON) {
    return null
  }

  const distance = Math.max(0, -projection - Math.sqrt(Math.max(0, discriminant)))
  if (distance > remainingDistance + PHYSICS_EPSILON) {
    return null
  }

  const positionAtImpact = {
    x: position.x + direction.x * distance,
    y: position.y + direction.y * distance,
  }
  return {
    distance,
    position: positionAtImpact,
    normal: normalizeOrUp({
      x: positionAtImpact.x - center.x,
      y: positionAtImpact.y - center.y,
    }),
  }
}

function createWallCandidate(
  distance: number,
  wall: 'left' | 'right',
  wallX: number,
  position: Point2D,
  direction: Point2D,
  remainingDistance: number,
  normal: Point2D,
): WallCandidate | null {
  if (distance < -PHYSICS_EPSILON || distance > remainingDistance + PHYSICS_EPSILON) {
    return null
  }
  const safeDistance = Math.max(0, distance)
  return {
    distance: safeDistance,
    wall,
    position: {
      x: wallX,
      y: position.y + direction.y * safeDistance,
    },
    normal,
  }
}

function normalizeOrUp(value: Point2D): Point2D {
  const length = Math.hypot(value.x, value.y)
  if (length <= PHYSICS_EPSILON) {
    return { x: 0, y: -1 }
  }
  return { x: value.x / length, y: value.y / length }
}
