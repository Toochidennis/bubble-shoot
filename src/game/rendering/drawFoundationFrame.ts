import type { CanvasMetrics } from './canvasMetrics'

export function drawFoundationFrame(
  context: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
): void {
  const { logicalWidth, logicalHeight } = metrics

  context.clearRect(0, 0, logicalWidth, logicalHeight)
  context.fillStyle = '#171a21'
  context.fillRect(0, 0, logicalWidth, logicalHeight)

  context.fillStyle = '#8d94a5'
  context.font = '600 13px system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(
    'Canvas foundation ready',
    logicalWidth / 2,
    logicalHeight / 2,
  )
}

