import type { LogicalViewport, Point2D } from '../../types/foundation'

export interface ClientPoint {
  readonly clientX: number
  readonly clientY: number
}

export interface ClientRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/** Converts CSS/client coordinates into logical Canvas coordinates. */
export function clientPointToLogicalPoint(
  point: ClientPoint,
  rect: ClientRect,
  viewport: LogicalViewport,
): Point2D {
  if (
    !Number.isFinite(point.clientX) ||
    !Number.isFinite(point.clientY) ||
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    throw new RangeError('Pointer and Canvas rectangle values must be finite and usable.')
  }

  return {
    x: (point.clientX - rect.left) * (viewport.width / rect.width),
    y: (point.clientY - rect.top) * (viewport.height / rect.height),
  }
}

