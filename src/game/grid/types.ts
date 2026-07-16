import type { Point2D } from '../../types/foundation'

export interface GridCoordinate {
  readonly row: number
  readonly column: number
}

export interface GridCell<T> {
  readonly coordinate: GridCoordinate
  readonly key: string
  readonly center: Point2D
  readonly occupied: boolean
  readonly value: T | undefined
}

export type GridOffsetRowParity = 'even' | 'odd'

export type BoardMutationFailure = 'invalid-coordinate' | 'occupied'

export type BoardMutationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: BoardMutationFailure }

