import type { CanvasMetrics } from './canvasMetrics'
import type { HexBoard } from '../grid/HexBoard'
import type { GridCoordinate } from '../grid/types'
import type { ProjectileImpact, ProjectileState } from '../physics/types'
import type { SnapResult } from '../snap/types'
import type { MatchResult } from '../match/types'
import type { FallingBubbleVisual } from '../floating/types'
import type { BubbleDescriptor, ShooterStateSnapshot } from '../shooter/types'
import type { TrajectoryPreview } from '../shooter/trajectory'
import { drawHexGridDebugFrame } from './drawHexGridDebug'

const DEBUG_SELECTED_CELL: GridCoordinate = { row: 0, column: 0 }
const BUBBLE_COLORS: Record<string, string> = {
  blue: '#58a6d8',
  green: '#69bf8c',
  purple: '#a886d6',
  red: '#db6c6c',
  yellow: '#e5bd68',
}

export function drawShooterDebugFrame(
  context: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
  board: HexBoard<BubbleDescriptor>,
  snapshot: ShooterStateSnapshot,
  trajectory: TrajectoryPreview,
  projectile: ProjectileState | null,
  impact: ProjectileImpact | null,
  snapResult: SnapResult | null,
  matchResult: MatchResult | null,
  fallingBubbles: readonly FallingBubbleVisual[],
): void {
  drawHexGridDebugFrame(context, metrics, board, DEBUG_SELECTED_CELL)
  drawOccupiedBubbles(context, board)
  drawSnapCandidates(context, board, snapResult)
  drawMatchCluster(context, board, matchResult)
  drawFallingBubbles(context, fallingBubbles)

  const { origin } = snapshot
  context.save()
  context.setLineDash([8, 6])
  context.lineWidth = 2
  context.strokeStyle = '#e5bd68'
  context.globalAlpha = projectile === null ? 0.9 : 0.35
  context.beginPath()
  for (const segment of trajectory.segments) {
    context.moveTo(segment.start.x, segment.start.y)
    context.lineTo(segment.end.x, segment.end.y)
  }
  context.stroke()
  context.restore()

  if (projectile !== null) {
    context.beginPath()
    context.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2)
    context.fillStyle = BUBBLE_COLORS[projectile.bubble.color] ?? '#d7dae1'
    context.fill()
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.stroke()
  }

  if (impact !== null) {
    context.save()
    context.beginPath()
    context.arc(impact.position.x, impact.position.y, 8, 0, Math.PI * 2)
    context.strokeStyle = impact.type === 'bubble' ? '#ffdc72' : '#8ee6ff'
    context.lineWidth = 3
    context.stroke()
    context.restore()
  }

  context.beginPath()
  context.arc(origin.x, origin.y, 16, 0, Math.PI * 2)
  context.fillStyle = BUBBLE_COLORS[snapshot.currentBubble.color] ?? '#d7dae1'
  context.fill()
  context.strokeStyle = '#f3f4f6'
  context.lineWidth = 2
  context.stroke()

  context.beginPath()
  context.moveTo(origin.x, origin.y)
  context.lineTo(origin.x + snapshot.aimDirection.x * 30, origin.y + snapshot.aimDirection.y * 30)
  context.strokeStyle = '#ffffff'
  context.lineWidth = 2
  context.stroke()

  const nextX = Math.max(10, Math.min(metrics.logicalWidth - 18, origin.x + 34))
  context.beginPath()
  context.arc(nextX, origin.y, 10, 0, Math.PI * 2)
  context.fillStyle = BUBBLE_COLORS[snapshot.nextBubble.color] ?? '#d7dae1'
  context.fill()
  context.strokeStyle = '#8d94a5'
  context.lineWidth = 1
  context.stroke()

  context.fillStyle = '#d7dae1'
  context.font = '10px system-ui, sans-serif'
  context.textAlign = 'left'
  context.textBaseline = 'bottom'
  const flightLabel = projectile === null
    ? impact === null ? 'READY' : `IMPACT ${impact.type.toUpperCase()}`
    : `FLIGHT ${projectile.id}`
  context.fillText(
    `PHYSICS DEBUG · ${snapshot.inputLocked ? 'LOCKED' : 'READY'} · ${flightLabel}`,
    12,
    Math.max(12, metrics.logicalHeight - 10),
  )
}

function drawMatchCluster(
  context: CanvasRenderingContext2D,
  board: HexBoard<BubbleDescriptor>,
  matchResult: MatchResult | null,
): void {
  if (matchResult === null || matchResult.cluster.length === 0) {
    return
  }

  for (const coordinate of matchResult.cluster) {
    const center = board.getValidCells().find(
      (cell) => cell.coordinate.row === coordinate.row && cell.coordinate.column === coordinate.column,
    )?.center
    if (center === undefined) {
      continue
    }
    context.save()
    context.beginPath()
    context.arc(center.x, center.y, board.config.bubbleRadius * 0.95, 0, Math.PI * 2)
    context.strokeStyle = matchResult.matched ? '#a5f28a' : '#e5bd68'
    context.lineWidth = matchResult.matched ? 3 : 1
    context.setLineDash(matchResult.matched ? [] : [2, 3])
    context.stroke()
    context.restore()
  }
}

function drawFallingBubbles(
  context: CanvasRenderingContext2D,
  fallingBubbles: readonly FallingBubbleVisual[],
): void {
  for (const falling of fallingBubbles) {
    context.save()
    context.globalAlpha = 0.8
    context.beginPath()
    context.arc(falling.position.x, falling.position.y, 10, 0, Math.PI * 2)
    context.fillStyle = BUBBLE_COLORS[falling.bubble.color] ?? '#d7dae1'
    context.fill()
    context.strokeStyle = '#ffffff'
    context.lineWidth = 1
    context.stroke()
    context.restore()
  }
}

function drawOccupiedBubbles(
  context: CanvasRenderingContext2D,
  board: HexBoard<BubbleDescriptor>,
): void {
  for (const cell of board.getOccupiedCells()) {
    if (cell.value === undefined) {
      continue
    }
    context.beginPath()
    context.arc(cell.center.x, cell.center.y, board.config.bubbleRadius * 0.72, 0, Math.PI * 2)
    context.fillStyle = BUBBLE_COLORS[cell.value.color] ?? '#d7dae1'
    context.globalAlpha = 0.85
    context.fill()
    context.globalAlpha = 1
    context.strokeStyle = '#ffffff'
    context.lineWidth = 1
    context.stroke()
  }
}

function drawSnapCandidates(
  context: CanvasRenderingContext2D,
  board: HexBoard<BubbleDescriptor>,
  snapResult: SnapResult | null,
): void {
  if (snapResult === null) {
    return
  }

  const selectedKey = snapResult.ok
    ? `${snapResult.coordinate.row}:${snapResult.coordinate.column}`
    : null
  for (const candidate of snapResult.candidates) {
    const isSelected = candidate.coordinate.row + ':' + candidate.coordinate.column === selectedKey
    context.save()
    context.setLineDash([3, 3])
    context.beginPath()
    context.arc(candidate.center.x, candidate.center.y, board.config.bubbleRadius * 0.9, 0, Math.PI * 2)
    context.strokeStyle = isSelected ? '#a5f28a' : '#e5bd68'
    context.lineWidth = isSelected ? 3 : 1
    context.stroke()
    context.restore()
  }
}
