import type { Point2D } from '../../types/foundation'
import type { GridOffsetRowParity } from './types'

export interface HexGridConfig {
  readonly rowCount: number
  readonly evenRowWidth: number
  readonly oddRowWidth: number
  readonly bubbleRadius: number
  readonly bubbleDiameter: number
  readonly horizontalSpacing: number
  readonly verticalSpacing: number
  readonly rowOffset: number
  readonly offsetRowParity: GridOffsetRowParity
  readonly origin: Point2D
}

export interface HexGridConfigInput {
  readonly rowCount: number
  readonly evenRowWidth: number
  readonly oddRowWidth: number
  readonly bubbleRadius: number
  readonly offsetRowParity?: GridOffsetRowParity
  readonly origin?: Point2D
}

export function createHexGridConfig(input: HexGridConfigInput): HexGridConfig {
  assertPositiveInteger(input.rowCount, 'rowCount')
  assertPositiveInteger(input.evenRowWidth, 'evenRowWidth')
  assertPositiveInteger(input.oddRowWidth, 'oddRowWidth')

  if (!Number.isFinite(input.bubbleRadius) || input.bubbleRadius <= 0) {
    throw new RangeError('bubbleRadius must be a finite number greater than zero.')
  }

  const bubbleDiameter = input.bubbleRadius * 2
  const origin = input.origin ?? { x: 0, y: 0 }

  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y)) {
    throw new TypeError('origin coordinates must be finite numbers.')
  }

  return {
    rowCount: input.rowCount,
    evenRowWidth: input.evenRowWidth,
    oddRowWidth: input.oddRowWidth,
    bubbleRadius: input.bubbleRadius,
    bubbleDiameter,
    horizontalSpacing: bubbleDiameter,
    verticalSpacing: Math.sqrt(3) * input.bubbleRadius,
    rowOffset: input.bubbleRadius,
    offsetRowParity: input.offsetRowParity ?? 'odd',
    origin: { x: origin.x, y: origin.y },
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer.`)
  }
}

export const DEFAULT_HEX_GRID_CONFIG = createHexGridConfig({
  rowCount: 19,
  evenRowWidth: 11,
  oddRowWidth: 10,
  bubbleRadius: 14,
  offsetRowParity: 'odd',
  origin: { x: 28, y: 24 },
})
