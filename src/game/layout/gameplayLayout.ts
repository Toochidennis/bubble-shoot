import type { LogicalViewport } from '../../types/foundation'
import { createHexGridConfig, type HexGridConfig } from '../grid/gridConfig'
import type { ProjectileConfig } from '../physics/types'
import { DEFAULT_PROJECTILE_CONFIG } from '../physics/physicsConfig'

/**
 * Authoritative world layout shared by the board, shooter, physics, and Canvas.
 * HUD spacing is expressed in logical pixels so the board is never hidden behind
 * the player-facing shell.
 */
export interface GameplayLayout {
  readonly hudInset: number
  /** Physical ceiling surface; bubble centers sit one radius below it. */
  readonly boardCeilingY: number
  readonly grid: HexGridConfig
  readonly projectile: ProjectileConfig
  readonly shooterBottomInset: number
}

export const DEFAULT_GAMEPLAY_HUD_INSET = 112
export const DEFAULT_GAMEPLAY_BOARD_CEILING_Y = DEFAULT_GAMEPLAY_HUD_INSET
export const DEFAULT_GAMEPLAY_SHOOTER_BOTTOM_INSET = 64
/** Responsive normal-bubble radius; shared by grid, shooter, projectile, and Canvas. */
export const GAMEPLAY_BUBBLE_RADIUS_SCALE = 1 / 24
export const GAMEPLAY_BUBBLE_RADIUS_MIN = 10
export const GAMEPLAY_BUBBLE_RADIUS_MAX = 18

export function createGameplayLayout(viewport: LogicalViewport): GameplayLayout {
  const width = Math.max(224, viewport.width)
  const height = Math.max(420, viewport.height)
  const rowCount = 19
  const verticalBudget = Math.max(0, height - DEFAULT_GAMEPLAY_HUD_INSET - DEFAULT_GAMEPLAY_SHOOTER_BOTTOM_INSET - 20)
  const verticalRadius = verticalBudget / (Math.sqrt(3) * (rowCount - 1) + 2)
  const radius = Math.min(
    GAMEPLAY_BUBBLE_RADIUS_MAX,
    Math.max(GAMEPLAY_BUBBLE_RADIUS_MIN, Math.min(width * GAMEPLAY_BUBBLE_RADIUS_SCALE, verticalRadius)),
  )
  const diameter = radius * 2
  const maxEvenCenter = 10 * diameter
  const originX = Math.max(radius, (width - maxEvenCenter) / 2)
  const boardCeilingY = DEFAULT_GAMEPLAY_BOARD_CEILING_Y
  const originY = boardCeilingY + radius
  const grid = createHexGridConfig({
    rowCount,
    evenRowWidth: 11,
    oddRowWidth: 10,
    bubbleRadius: radius,
    offsetRowParity: 'odd',
    origin: { x: originX, y: originY },
  })
  return {
    hudInset: DEFAULT_GAMEPLAY_HUD_INSET,
    boardCeilingY,
    grid,
    projectile: { ...DEFAULT_PROJECTILE_CONFIG, radius },
    shooterBottomInset: DEFAULT_GAMEPLAY_SHOOTER_BOTTOM_INSET,
  }
}
