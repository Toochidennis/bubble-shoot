import type { LogicalViewport } from '../../types/foundation'

export interface CanvasMetrics extends LogicalViewport {
  readonly logicalWidth: number
  readonly logicalHeight: number
  readonly backingWidth: number
  readonly backingHeight: number
}

export function calculateCanvasMetrics(
  displayWidth: number,
  displayHeight: number,
  devicePixelRatio: number,
  maxDevicePixelRatio: number,
): CanvasMetrics {
  const logicalWidth = Math.max(0, displayWidth)
  const logicalHeight = Math.max(0, displayHeight)
  const pixelRatio = Math.max(1, Math.min(devicePixelRatio, maxDevicePixelRatio))

  return {
    width: logicalWidth,
    height: logicalHeight,
    logicalWidth,
    logicalHeight,
    backingWidth: Math.max(1, Math.round(logicalWidth * pixelRatio)),
    backingHeight: Math.max(1, Math.round(logicalHeight * pixelRatio)),
    pixelRatio,
  }
}

export function applyCanvasMetrics(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
): void {
  if (canvas.width !== metrics.backingWidth) {
    canvas.width = metrics.backingWidth
  }

  if (canvas.height !== metrics.backingHeight) {
    canvas.height = metrics.backingHeight
  }

  context.setTransform(metrics.pixelRatio, 0, 0, metrics.pixelRatio, 0, 0)
}

