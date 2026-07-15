import type { Point2D } from '../../types/foundation'
import type { GridCoordinate } from '../grid/types'
import type { ProjectileImpact, ImpactType } from '../physics/types'
import type { BubbleDescriptor } from '../shooter/types'

export interface SnapConfig {
  readonly maxCeilingDistanceMultiplier: number
}

export interface SnapCandidate {
  readonly coordinate: GridCoordinate
  readonly center: Point2D
  readonly distanceSquared: number
  readonly approachAlignment: number
}

export type SnapFailureReason =
  | 'unsupported-impact'
  | 'invalid-impact-coordinate'
  | 'no-valid-candidate'
  | 'placement-rejected'

export interface SnapCandidateSet {
  readonly impactType: ImpactType
  readonly candidates: readonly SnapCandidate[]
}

export type SnapResult =
  | {
      readonly ok: true
      readonly coordinate: GridCoordinate
      readonly center: Point2D
      readonly bubble: BubbleDescriptor
      readonly impactType: Extract<ImpactType, 'ceiling' | 'bubble'>
      readonly impactedCoordinate: GridCoordinate | undefined
      readonly candidates: readonly SnapCandidate[]
    }
  | {
      readonly ok: false
      readonly reason: SnapFailureReason
      readonly impactType: ImpactType
      readonly impactedCoordinate: GridCoordinate | undefined
      readonly candidates: readonly SnapCandidate[]
    }

export type SnappableImpact = Omit<ProjectileImpact, 'type'> & {
  readonly type: 'ceiling' | 'bubble'
}
