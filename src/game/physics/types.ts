import type { Point2D } from '../../types/foundation'
import type { GridCoordinate } from '../grid/types'
import type { BubbleDescriptor } from '../shooter/types'

export type ProjectileStatus = 'active' | 'completed'

export interface ProjectileBounds {
  readonly leftWallX: number
  readonly rightWallX: number
  readonly topY: number
}

export interface BubbleCollider {
  readonly coordinate: GridCoordinate
  readonly center: Point2D
  readonly radius: number
  readonly bubble: BubbleDescriptor
}

export interface ProjectileConfig {
  readonly speed: number
  readonly radius: number
  readonly maxDeltaSeconds: number
  readonly maxCollisionIterations: number
}

export interface ProjectileState {
  readonly id: string
  readonly bubble: BubbleDescriptor
  readonly position: Point2D
  readonly direction: Point2D
  readonly speed: number
  readonly radius: number
  readonly travelDistance: number
  readonly elapsedSeconds: number
  readonly status: ProjectileStatus
}

export interface ProjectileSpawnRequest {
  readonly id: string
  readonly bubble: BubbleDescriptor
  readonly origin: Point2D
  readonly direction: Point2D
  readonly config: ProjectileConfig
}

export type ImpactType = 'ceiling' | 'bubble' | 'safety-limit'

export interface ProjectileImpact {
  readonly type: ImpactType
  readonly position: Point2D
  readonly direction: Point2D
  readonly normal: Point2D
  readonly coordinate?: GridCoordinate
  readonly bubbleCenter?: Point2D
  readonly bubble?: BubbleDescriptor
}

export interface WallBounceEvent {
  readonly wall: 'left' | 'right'
  readonly position: Point2D
}

export interface ProjectileStepResult {
  readonly projectile: ProjectileState
  readonly impact: ProjectileImpact | null
  readonly wallBounces: readonly WallBounceEvent[]
  readonly deltaSeconds: number
}

export type ProjectileSpawnResult =
  | { readonly accepted: true; readonly projectile: ProjectileState }
  | {
      readonly accepted: false
      readonly reason: 'active-projectile' | 'completed-result-pending'
    }
