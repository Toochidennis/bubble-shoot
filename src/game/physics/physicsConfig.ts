import type { ProjectileConfig } from './types'

export const PHYSICS_EPSILON = 1e-8
/** Responsive-feeling default: quick enough for mobile play while retaining readable wall bounces. */
export const DEFAULT_PROJECTILE_SPEED = 1_000
export const DEFAULT_PROJECTILE_CONFIG: ProjectileConfig = Object.freeze({
  speed: DEFAULT_PROJECTILE_SPEED,
  radius: 14,
  maxDeltaSeconds: 0.25,
  maxCollisionIterations: 16,
})

export function validateProjectileConfig(config: ProjectileConfig): void {
  if (!Number.isFinite(config.speed) || config.speed <= 0) {
    throw new RangeError('Projectile speed must be finite and greater than zero.')
  }
  if (!Number.isFinite(config.radius) || config.radius <= 0) {
    throw new RangeError('Projectile radius must be finite and greater than zero.')
  }
  if (!Number.isFinite(config.maxDeltaSeconds) || config.maxDeltaSeconds <= 0) {
    throw new RangeError('Maximum projectile delta must be finite and greater than zero.')
  }
  if (!Number.isSafeInteger(config.maxCollisionIterations) || config.maxCollisionIterations <= 0) {
    throw new RangeError('Maximum collision iterations must be a positive safe integer.')
  }
}
