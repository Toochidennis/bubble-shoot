import type { Point2D } from '../../types/foundation'

import type { AimLimits } from './types'

const EPSILON = 1e-9
const MAX_SAFE_AIM_ANGLE = Math.PI / 2 - EPSILON

/** Signed radians from upward vertical: negative is left and positive is right. */
export const DEFAULT_AIM_LIMITS: AimLimits = Object.freeze({
  minAngleRadians: -Math.PI * 0.38,
  maxAngleRadians: Math.PI * 0.38,
})

export interface AimResult {
  readonly angleRadians: number
  readonly direction: Point2D
}

export function normalizeDirection(direction: Point2D): Point2D {
  const length = Math.hypot(direction.x, direction.y)

  if (length <= EPSILON) {
    return { x: 0, y: -1 }
  }

  return {
    x: direction.x / length,
    y: direction.y / length,
  }
}

export function angleToDirection(angleRadians: number): Point2D {
  if (!Number.isFinite(angleRadians)) {
    throw new TypeError('Aim angle must be finite.')
  }

  return normalizeDirection({
    x: Math.sin(angleRadians),
    y: -Math.cos(angleRadians),
  })
}

export function clampAimAngle(
  angleRadians: number,
  limits: AimLimits = DEFAULT_AIM_LIMITS,
): number {
  validateAimLimits(limits)

  if (!Number.isFinite(angleRadians)) {
    throw new TypeError('Aim angle must be finite.')
  }

  return Math.min(
    limits.maxAngleRadians,
    Math.max(limits.minAngleRadians, angleRadians),
  )
}

export function aimDirectionFromPointer(
  origin: Point2D,
  pointer: Point2D,
  limits: AimLimits = DEFAULT_AIM_LIMITS,
): AimResult {
  const deltaX = pointer.x - origin.x
  const deltaY = pointer.y - origin.y

  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
    throw new TypeError('Pointer coordinates must be finite.')
  }

  if (Math.hypot(deltaX, deltaY) <= EPSILON) {
    return { angleRadians: 0, direction: angleToDirection(0) }
  }

  // atan2(x, -y) measures the signed angle from upward vertical.
  // A directly downward pointer has no meaningful side preference, so it
  // returns to the stable vertical aim instead of choosing a wall bias.
  const rawAngle = deltaY >= 0 && Math.abs(deltaX) <= EPSILON
    ? 0
    : Math.atan2(deltaX, -deltaY)
  const angleRadians = clampAimAngle(rawAngle, limits)

  return { angleRadians, direction: angleToDirection(angleRadians) }
}

function validateAimLimits(limits: AimLimits): void {
  if (
    !Number.isFinite(limits.minAngleRadians) ||
    !Number.isFinite(limits.maxAngleRadians) ||
    limits.minAngleRadians >= limits.maxAngleRadians ||
    limits.minAngleRadians < -MAX_SAFE_AIM_ANGLE ||
    limits.maxAngleRadians > MAX_SAFE_AIM_ANGLE
  ) {
    throw new RangeError(
      'Aim limits must be ordered and remain within the upward hemisphere.',
    )
  }
}

