import type { Point2D } from '../../types/foundation'
import type { FireRequestResult } from '../shooter/types'

import { createProjectile, stepProjectile, type ProjectileStepEnvironment } from './projectileStepper'
import { DEFAULT_PROJECTILE_CONFIG, validateProjectileConfig } from './physicsConfig'
import type {
  ProjectileConfig,
  ProjectileImpact,
  ProjectileSpawnResult,
  ProjectileState,
  ProjectileStepResult,
} from './types'

export class ProjectileManager {
  private activeProjectile: ProjectileState | null = null
  private lastImpact: ProjectileImpact | null = null
  private nextId = 1

  public constructor(private readonly config: ProjectileConfig = DEFAULT_PROJECTILE_CONFIG) {
    validateProjectileConfig(config)
  }

  public get active(): ProjectileState | null {
    return this.activeProjectile
  }

  public get completedImpact(): ProjectileImpact | null {
    return this.lastImpact
  }

  public spawnFromFire(
    fireRequest: Extract<FireRequestResult, { accepted: true }>,
    origin: Point2D,
  ): ProjectileSpawnResult {
    if (this.activeProjectile !== null) {
      return { accepted: false, reason: 'active-projectile' }
    }
    if (this.lastImpact !== null) {
      return { accepted: false, reason: 'completed-result-pending' }
    }

    const projectile = createProjectile({
      id: `projectile-${this.nextId}`,
      bubble: fireRequest.bubble,
      origin,
      direction: fireRequest.aimDirection,
      config: this.config,
    })
    this.nextId += 1
    this.activeProjectile = projectile
    return { accepted: true, projectile }
  }

  public step(
    elapsedSeconds: number,
    environment: ProjectileStepEnvironment,
  ): ProjectileStepResult | null {
    if (this.activeProjectile === null) {
      return null
    }

    const result = stepProjectile(
      this.activeProjectile,
      elapsedSeconds,
      environment,
      this.config,
    )
    this.activeProjectile = result.projectile.status === 'active' ? result.projectile : null
    if (result.impact !== null) {
      this.lastImpact = result.impact
    }
    return result
  }

  public clearCompletedImpact(): void {
    this.lastImpact = null
  }
}
