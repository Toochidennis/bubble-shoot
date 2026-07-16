import type { Point2D } from '../../types/foundation'

import { normalizeDirection } from '../shooter/aimMath'

import {
  findCeilingCandidate,
  findCircleCandidate,
  findWallCandidate,
  type CircleCandidate,
} from './collisionGeometry'
import { PHYSICS_EPSILON, validateProjectileConfig } from './physicsConfig'
import type {
  BubbleCollider,
  ProjectileBounds,
  ProjectileConfig,
  ProjectileImpact,
  ProjectileSpawnRequest,
  ProjectileState,
  ProjectileStepResult,
  WallBounceEvent,
} from './types'

export interface ProjectileStepEnvironment {
  readonly bounds: ProjectileBounds
  readonly bubbles: readonly BubbleCollider[]
}

export function createProjectile(request: ProjectileSpawnRequest): ProjectileState {
  validateProjectileConfig(request.config)
  validatePoint(request.origin, 'Projectile origin')
  const direction = normalizeDirection(request.direction)
  if (direction.y >= -PHYSICS_EPSILON) {
    throw new RangeError('Projectile direction must point into the upward playfield.')
  }

  return {
    id: request.id,
    bubble: request.bubble,
    position: { x: request.origin.x, y: request.origin.y },
    direction,
    speed: request.config.speed,
    radius: request.config.radius,
    travelDistance: 0,
    elapsedSeconds: 0,
    status: 'active',
  }
}

export function stepProjectile(
  projectile: ProjectileState,
  elapsedSeconds: number,
  environment: ProjectileStepEnvironment,
  config: ProjectileConfig,
): ProjectileStepResult {
  validateProjectileConfig(config)
  validatePoint(projectile.position, 'Projectile position')
  validateBounds(environment.bounds)
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new RangeError('Projectile elapsed time must be finite and non-negative.')
  }

  const deltaSeconds = Math.min(elapsedSeconds, config.maxDeltaSeconds)
  if (projectile.status === 'completed' || deltaSeconds <= 0) {
    return { projectile, impact: null, wallBounces: [], deltaSeconds }
  }

  let position = { ...projectile.position }
  let direction = { ...projectile.direction }
  let remainingDistance = projectile.speed * deltaSeconds
  let traveledDistance = projectile.travelDistance
  const wallBounces: WallBounceEvent[] = []

  for (let iteration = 0; iteration < config.maxCollisionIterations; iteration += 1) {
    if (remainingDistance <= PHYSICS_EPSILON) {
      break
    }

    const candidate = findEarliestCandidate(
      position,
      direction,
      remainingDistance,
      environment,
      config,
    )

    if (candidate === null) {
      position = advance(position, direction, remainingDistance)
      traveledDistance += remainingDistance
      remainingDistance = 0
      break
    }

    position = candidate.position
    traveledDistance += candidate.distance
    remainingDistance = Math.max(0, remainingDistance - candidate.distance)

    if (candidate.kind === 'ceiling' || candidate.kind === 'bubble') {
      const impact: ProjectileImpact = candidate.kind === 'ceiling'
        ? {
            type: 'ceiling',
            position,
            direction,
            normal: { x: 0, y: 1 },
          }
        : {
            type: 'bubble',
            position,
            direction,
            normal: candidate.normal,
            coordinate: candidate.collider.coordinate,
            bubbleCenter: candidate.collider.center,
            bubble: candidate.collider.bubble,
          }
      return {
        projectile: {
          ...projectile,
          position,
          direction,
          travelDistance: traveledDistance,
          elapsedSeconds: projectile.elapsedSeconds + deltaSeconds,
          status: 'completed',
        },
        impact,
        wallBounces,
        deltaSeconds,
      }
    }

    direction = { x: -direction.x, y: direction.y }
    wallBounces.push({ wall: candidate.wall, position })
  }

  if (remainingDistance > PHYSICS_EPSILON) {
    const safetyImpact: ProjectileImpact = {
      type: 'safety-limit',
      position,
      direction,
      normal: { x: -direction.x, y: -direction.y },
    }
    return {
      projectile: {
        ...projectile,
        position,
        direction,
        travelDistance: traveledDistance,
        elapsedSeconds: projectile.elapsedSeconds + deltaSeconds,
        status: 'completed',
      },
      impact: safetyImpact,
      wallBounces,
      deltaSeconds,
    }
  }

  return {
    projectile: {
      ...projectile,
      position,
      direction,
      travelDistance: traveledDistance,
      elapsedSeconds: projectile.elapsedSeconds + deltaSeconds,
    },
    impact: null,
    wallBounces,
    deltaSeconds,
  }
}

type CollisionCandidate =
  | { readonly kind: 'wall'; readonly distance: number; readonly position: Point2D; readonly wall: 'left' | 'right' }
  | { readonly kind: 'ceiling'; readonly distance: number; readonly position: Point2D }
  | ({ readonly kind: 'bubble'; readonly collider: BubbleCollider } & CircleCandidate)

function findEarliestCandidate(
  position: Point2D,
  direction: Point2D,
  remainingDistance: number,
  environment: ProjectileStepEnvironment,
  config: ProjectileConfig,
): CollisionCandidate | null {
  const candidates: CollisionCandidate[] = []
  const wall = findWallCandidate(
    position,
    direction,
    remainingDistance,
    environment.bounds,
    config,
  )
  if (wall !== null) {
    candidates.push({ kind: 'wall', ...wall })
  }

  const ceiling = findCeilingCandidate(
    position,
    direction,
    remainingDistance,
    environment.bounds,
    config,
  )
  if (ceiling !== null) {
    candidates.push({ kind: 'ceiling', ...ceiling })
  }

  for (const collider of environment.bubbles) {
    const bubble = findCircleCandidate(
      position,
      direction,
      remainingDistance,
      collider.center,
      config.radius + collider.radius,
    )
    if (bubble !== null) {
      candidates.push({ kind: 'bubble', collider, ...bubble })
    }
  }

  candidates.sort(compareCandidates)
  return candidates[0] ?? null
}

function compareCandidates(left: CollisionCandidate, right: CollisionCandidate): number {
  const distanceDifference = left.distance - right.distance
  if (Math.abs(distanceDifference) > PHYSICS_EPSILON) {
    return distanceDifference
  }
  return candidatePriority(left) - candidatePriority(right)
}

function candidatePriority(candidate: CollisionCandidate): number {
  if (candidate.kind === 'bubble') {
    return 0
  }
  if (candidate.kind === 'ceiling') {
    return 1
  }
  return candidate.wall === 'left' ? 2 : 3
}

function advance(position: Point2D, direction: Point2D, distance: number): Point2D {
  return {
    x: position.x + direction.x * distance,
    y: position.y + direction.y * distance,
  }
}

function validatePoint(value: Point2D, label: string): void {
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) {
    throw new TypeError(`${label} coordinates must be finite.`)
  }
}

function validateBounds(bounds: ProjectileBounds): void {
  if (
    !Number.isFinite(bounds.leftWallX) ||
    !Number.isFinite(bounds.rightWallX) ||
    !Number.isFinite(bounds.topY) ||
    bounds.leftWallX >= bounds.rightWallX
  ) {
    throw new RangeError('Projectile bounds must be finite with a positive width.')
  }
}
