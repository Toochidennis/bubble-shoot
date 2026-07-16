import type { SnapConfig } from './types'

export const DEFAULT_SNAP_CONFIG: SnapConfig = Object.freeze({
  // Retained as a validated compatibility setting; ceiling candidates are no
  // longer rejected by an arbitrary distance cutoff.
  maxCeilingDistanceMultiplier: 1.5,
})
