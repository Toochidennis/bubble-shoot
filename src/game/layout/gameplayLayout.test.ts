import { describe, expect, it } from 'vitest'

import { getCellCenter } from '../grid/coordinates'
import { getLevel } from '../levels/levelCatalog'
import { createProjectile, stepProjectile } from '../physics/projectileStepper'
import { DEFAULT_PROJECTILE_CONFIG } from '../physics/physicsConfig'
import type { BubbleDescriptor } from '../shooter/types'
import { createGameplayLayout, GAMEPLAY_BUBBLE_RADIUS_MAX, GAMEPLAY_BUBBLE_RADIUS_MIN } from './gameplayLayout'

describe('gameplay layout', () => {
  it('starts the board below the compact HUD and keeps row zero inside the viewport', () => {
    const layout = createGameplayLayout({ width: 224, height: 640, pixelRatio: 1 })
    const rowZero = getCellCenter(layout.grid, { row: 0, column: 0 })
    expect(layout.boardCeilingY).toBe(layout.grid.origin.y - layout.grid.bubbleRadius)
    expect(rowZero.y).toBeCloseTo(layout.boardCeilingY + layout.grid.bubbleRadius)
    expect(rowZero.y - layout.grid.bubbleRadius).toBeGreaterThanOrEqual(layout.hudInset)
    expect(rowZero.x - layout.grid.bubbleRadius).toBeGreaterThanOrEqual(0)
    expect(rowZero.x + 10 * layout.grid.horizontalSpacing + layout.grid.bubbleRadius).toBeLessThanOrEqual(224)
    expect(layout.projectile.radius).toBe(layout.grid.bubbleRadius)
    expect(layout.grid.bubbleRadius).toBeGreaterThanOrEqual(GAMEPLAY_BUBBLE_RADIUS_MIN)
    expect(layout.grid.bubbleRadius).toBeLessThanOrEqual(GAMEPLAY_BUBBLE_RADIUS_MAX)
  })

  it('keeps a readable shooter region below the board for mobile and portrait desktop viewports', () => {
    for (const viewport of [
      { width: 224, height: 640, pixelRatio: 1 },
      { width: 320, height: 568, pixelRatio: 1 },
      { width: 480, height: 800, pixelRatio: 1 },
    ]) {
      const layout = createGameplayLayout(viewport)
      const shooterY = viewport.height - layout.shooterBottomInset
      const boardBottom = layout.grid.origin.y + 4 * layout.grid.verticalSpacing + layout.grid.bubbleRadius
      expect(shooterY).toBeGreaterThan(boardBottom)
      expect(layout.grid.origin.y).toBeGreaterThan(layout.hudInset)
    }
  })

  it('keeps representative curated and generated occupied cells in the visible board region', () => {
    const viewport = { width: 320, height: 568, pixelRatio: 1 }
    const layout = createGameplayLayout(viewport)
    for (const levelId of [1, 2, 5, 15, 16]) {
      const access = getLevel(levelId)
      expect(access.ok).toBe(true)
      if (!access.ok) continue
      for (const placement of access.level.startingBubbles) {
        const center = getCellCenter(layout.grid, placement.coordinate)
        expect(center.y - layout.grid.bubbleRadius).toBeGreaterThanOrEqual(layout.hudInset - 1e-9)
        expect(center.x - layout.grid.bubbleRadius).toBeGreaterThanOrEqual(0)
        expect(center.x + layout.grid.bubbleRadius).toBeLessThanOrEqual(viewport.width)
      }
    }
  })

  it('uses the reduced authoritative radius while keeping the board inside mobile viewports', () => {
    for (const width of [224, 320, 430, 480]) {
      const layout = createGameplayLayout({ width, height: 784, pixelRatio: 1 })
      const radius = layout.grid.bubbleRadius
      const firstCenter = getCellCenter(layout.grid, { row: 0, column: 0 })
      const lastCenter = getCellCenter(layout.grid, { row: 0, column: 10 })
      const verticalRadius = (784 - 112 - 64 - 20) / (Math.sqrt(3) * 18 + 2)
      expect(radius).toBeCloseTo(Math.min(18, Math.max(10, Math.min(width / 24, verticalRadius))))
      expect(firstCenter.x - radius).toBeGreaterThanOrEqual(0)
      expect(lastCenter.x + radius).toBeLessThanOrEqual(width)
      expect(layout.projectile.radius).toBe(radius)
    }
  })

  it('uses the same ceiling surface for projectile contact and row-zero centers', () => {
    const layout = createGameplayLayout({ width: 320, height: 640, pixelRatio: 1 })
    const bubble: BubbleDescriptor = { color: 'blue' }
    const physicsConfig = { ...DEFAULT_PROJECTILE_CONFIG, ...layout.projectile, maxDeltaSeconds: 1 }
    const projectile = createProjectile({
      id: 'ceiling-test',
      bubble,
      origin: { x: 160, y: layout.boardCeilingY + 220 },
      direction: { x: 0, y: -1 },
      config: physicsConfig,
    })
    const result = stepProjectile(
      projectile,
      1,
      { bounds: { leftWallX: 0, rightWallX: 320, topY: layout.boardCeilingY }, bubbles: [] },
      physicsConfig,
    )
    expect(result.impact?.type).toBe('ceiling')
    expect(result.projectile.position.y).toBeCloseTo(layout.boardCeilingY + layout.projectile.radius)
    expect(getCellCenter(layout.grid, { row: 0, column: 0 }).y).toBeCloseTo(layout.boardCeilingY + layout.grid.bubbleRadius)
  })
})
