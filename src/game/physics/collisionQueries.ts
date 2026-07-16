import type { HexBoard } from '../grid/HexBoard'
import type { BubbleDescriptor } from '../shooter/types'

import type { BubbleCollider } from './types'

export function getOccupiedBubbleColliders(
  board: HexBoard<BubbleDescriptor>,
  radius: number,
): BubbleCollider[] {
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new RangeError('Bubble collider radius must be finite and greater than zero.')
  }

  return board
    .getOccupiedCells()
    .flatMap((cell) =>
      cell.value === undefined
        ? []
        : [{
            coordinate: cell.coordinate,
            center: cell.center,
            radius,
            bubble: cell.value,
          }],
    )
}
