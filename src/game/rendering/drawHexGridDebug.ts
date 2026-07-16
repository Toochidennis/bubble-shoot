import type { CanvasMetrics } from './canvasMetrics'
import type { HexBoard } from '../grid/HexBoard'
import { coordinateKey } from '../grid/coordinates'
import type { GridCoordinate } from '../grid/types'

const CELL_OUTLINE_SCALE = 0.86

export function drawHexGridDebugFrame<T>(
  context: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
  board: HexBoard<T>,
  selectedCell: GridCoordinate,
): void {
  const { logicalWidth, logicalHeight } = metrics
  const selectedKey = coordinateKey(selectedCell)
  const neighborKeys = new Set(
    board.getNeighborCells(selectedCell).map((cell) => cell.key),
  )

  context.clearRect(0, 0, logicalWidth, logicalHeight)
  context.fillStyle = '#171a21'
  context.fillRect(0, 0, logicalWidth, logicalHeight)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '10px system-ui, sans-serif'

  for (const cell of board.getValidCells()) {
    const isSelected = cell.key === selectedKey
    const isNeighbor = neighborKeys.has(cell.key)
    const radius = board.config.bubbleRadius * CELL_OUTLINE_SCALE

    context.beginPath()
    context.arc(cell.center.x, cell.center.y, radius, 0, Math.PI * 2)
    context.fillStyle = isSelected
      ? '#4b3e24'
      : isNeighbor
        ? '#20382e'
        : '#1d222b'
    context.fill()
    context.strokeStyle = isSelected
      ? '#e2b866'
      : isNeighbor
        ? '#6ca881'
        : '#586273'
    context.lineWidth = isSelected || isNeighbor ? 2 : 1
    context.stroke()

    context.fillStyle = isSelected
      ? '#f0d293'
      : isNeighbor
        ? '#a8d8b7'
        : '#9ba4b4'
    context.fillText(
      `${cell.coordinate.row},${cell.coordinate.column}`,
      cell.center.x,
      cell.center.y,
    )
  }

  context.fillStyle = '#8d94a5'
  context.textAlign = 'left'
  context.textBaseline = 'top'
  context.fillText(
    `HEX DEBUG · ${board.config.rowCount} rows · selected ${selectedCell.row},${selectedCell.column}`,
    12,
    10,
  )
}

