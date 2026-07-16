import { describe, expect, it } from 'vitest'

import { HexBoard } from '../grid/HexBoard'
import { createHexGridConfig } from '../grid/gridConfig'
import { createDefaultShooterConfig } from '../shooter/shooterConfig'
import { ShooterState } from '../shooter/ShooterState'
import type { BubbleDescriptor } from '../shooter/types'

import { getOccupiedBubbleColliders } from './collisionQueries'
import { ProjectileManager } from './ProjectileManager'
import { DEFAULT_PROJECTILE_CONFIG } from './physicsConfig'
import { createProjectile, stepProjectile } from './projectileStepper'
import type { ProjectileConfig, ProjectileState } from './types'

const bubble: BubbleDescriptor = { color: 'purple' }
const bounds = { leftWallX: 0, rightWallX: 100, topY: 0 }
const config: ProjectileConfig = {
  speed: 100,
  radius: 10,
  maxDeltaSeconds: 1,
  maxCollisionIterations: 16,
}

function projectile(
  origin = { x: 50, y: 180 },
  direction = { x: 0, y: -1 },
  overrides: Partial<ProjectileConfig> = {},
): ProjectileState {
  return createProjectile({
    id: 'test-projectile',
    bubble,
    origin,
    direction,
    config: { ...config, ...overrides },
  })
}

describe('projectile creation and ownership', () => {
  it('inherits the fired bubble, starts at the muzzle, and normalizes direction', () => {
    const created = projectile({ x: 50, y: 180 }, { x: 3, y: -4 })

    expect(created.bubble).toEqual(bubble)
    expect(created.position).toEqual({ x: 50, y: 180 })
    expect(created.direction.x).toBeCloseTo(0.6)
    expect(created.direction.y).toBeCloseTo(-0.8)
    expect(created.status).toBe('active')
  })

  it('enforces zero or one active projectile and retains terminal ownership', () => {
    const manager = new ProjectileManager(config)
    const fire = { accepted: true as const, bubble, aimDirection: { x: 0, y: -1 } }

    expect(manager.spawnFromFire(fire, { x: 50, y: 100 }).accepted).toBe(true)
    expect(manager.spawnFromFire(fire, { x: 50, y: 100 })).toEqual({
      accepted: false,
      reason: 'active-projectile',
    })

    const result = manager.step(1, { bounds, bubbles: [] })
    expect(result?.impact?.type).toBe('ceiling')
    expect(manager.active).toBeNull()
    expect(manager.completedImpact?.type).toBe('ceiling')
    expect(manager.spawnFromFire(fire, { x: 50, y: 100 })).toEqual({
      accepted: false,
      reason: 'completed-result-pending',
    })
  })

  it('keeps the approved shooter boundary locked through projectile completion', () => {
    const shooter = new ShooterState(createDefaultShooterConfig({
      width: 100,
      height: 172,
      pixelRatio: 1,
    }))
    const manager = new ProjectileManager(config)
    const fire = shooter.requestFire()
    expect(fire.accepted).toBe(true)
    if (!fire.accepted) {
      return
    }

    const spawn = manager.spawnFromFire(fire, shooter.snapshot().origin)
    expect(spawn.accepted).toBe(true)
    expect(shooter.snapshot().inputLocked).toBe(true)
    expect(shooter.requestFire()).toEqual({
      accepted: false,
      reason: 'fire-request-pending',
    })

    manager.step(1, { bounds, bubbles: [] })
    expect(manager.completedImpact?.type).toBe('ceiling')
    expect(shooter.snapshot().inputLocked).toBe(true)
  })
})

describe('frame-independent projectile movement', () => {
  it('produces equivalent travel over 100ms, 2x50ms, and 10x10ms', () => {
    const environment = { bounds: { leftWallX: -1000, rightWallX: 1000, topY: -1000 }, bubbles: [] }
    const one = stepProjectile(projectile(), 0.1, environment, config).projectile

    let fifty = projectile()
    fifty = stepProjectile(fifty, 0.05, environment, config).projectile
    fifty = stepProjectile(fifty, 0.05, environment, config).projectile

    let ten = projectile()
    for (let index = 0; index < 10; index += 1) {
      ten = stepProjectile(ten, 0.01, environment, config).projectile
    }

    expect(fifty.position.x).toBeCloseTo(one.position.x)
    expect(fifty.position.y).toBeCloseTo(one.position.y)
    expect(ten.position.x).toBeCloseTo(one.position.x)
    expect(ten.position.y).toBeCloseTo(one.position.y)
    expect(one.travelDistance).toBeCloseTo(10)
  })

  it('caps a very large elapsed time using the configured safety limit', () => {
    const capped = stepProjectile(
      projectile({ x: 50, y: 180 }, { x: 0, y: -1 }, { maxDeltaSeconds: 0.25 }),
      10,
      { bounds: { leftWallX: -1000, rightWallX: 1000, topY: -1000 }, bubbles: [] },
      { ...config, maxDeltaSeconds: 0.25 },
    )

    expect(capped.deltaSeconds).toBe(0.25)
    expect(capped.projectile.travelDistance).toBeCloseTo(25)
  })
})

describe('continuous wall and ceiling collision', () => {
  it('reflects at the left wall while respecting projectile radius and preserves vertical speed', () => {
    const result = stepProjectile(
      projectile({ x: 50, y: 100 }, { x: -0.8, y: -0.6 }),
      0.6,
      { bounds, bubbles: [] },
      config,
    )

    expect(result.wallBounces).toHaveLength(1)
    expect(result.wallBounces[0]?.wall).toBe('left')
    expect(result.wallBounces[0]?.position.x).toBeCloseTo(10)
    expect(result.projectile.position.x).toBeGreaterThan(10)
    expect(result.projectile.direction.x).toBeCloseTo(0.8)
    expect(result.projectile.direction.y).toBeCloseTo(-0.6)
  })

  it('reflects at the right wall and cannot escape at high speed', () => {
    const result = stepProjectile(
      projectile({ x: 50, y: 150 }, { x: 0.99, y: -0.1 }, { speed: 1000 }),
      0.5,
      { bounds, bubbles: [] },
      { ...config, speed: 1000 },
    )

    expect(result.wallBounces.length).toBeGreaterThan(0)
    expect(result.projectile.position.x).toBeGreaterThanOrEqual(10)
    expect(result.projectile.position.x).toBeLessThanOrEqual(90)
    expect(result.projectile.direction.y).toBeCloseTo(-0.1 / Math.hypot(0.99, 0.1))
  })

  it('stops at the ceiling with radius clearance', () => {
    const result = stepProjectile(projectile({ x: 50, y: 100 }), 1, { bounds, bubbles: [] }, config)

    expect(result.impact?.type).toBe('ceiling')
    expect(result.projectile.position.y).toBeCloseTo(10)
    expect(result.projectile.status).toBe('completed')
  })

  it('detects an angled ceiling impact continuously', () => {
    const result = stepProjectile(
      projectile({ x: 30, y: 100 }, { x: 0.6, y: -0.8 }, { speed: 150 }),
      1.5,
      { bounds, bubbles: [] },
      { ...config, speed: 150 },
    )

    expect(result.impact?.type).toBe('ceiling')
    expect(result.projectile.position.y).toBeCloseTo(10)
    expect(result.projectile.position.x).toBeGreaterThan(30)
  })
})

describe('continuous occupied-bubble collision and ordering', () => {
  const occupied = {
    coordinate: { row: 1, column: 1 },
    center: { x: 50, y: 50 },
    radius: 10,
    bubble,
  }

  it('detects a direct occupied-cell impact without mutating the board', () => {
    const result = stepProjectile(
      projectile({ x: 50, y: 100 }),
      1,
      { bounds, bubbles: [occupied] },
      config,
    )

    expect(result.impact).toMatchObject({
      type: 'bubble',
      coordinate: { row: 1, column: 1 },
      bubbleCenter: { x: 50, y: 50 },
    })
    expect(result.projectile.position.y).toBeCloseTo(70)
    expect(result.projectile.status).toBe('completed')
  })

  it('detects angled contact and rejects a near miss', () => {
    const angled = stepProjectile(
      projectile({ x: 30, y: 100 }, { x: 0.6, y: -0.8 }),
      1,
      { bounds, bubbles: [{ ...occupied, center: { x: 68, y: 50 } }] },
      config,
    )
    const miss = stepProjectile(
      projectile({ x: 29, y: 100 }),
      0.8,
      { bounds, bubbles: [occupied] },
      config,
    )

    expect(angled.impact?.type).toBe('bubble')
    expect(miss.impact).toBeNull()
  })

  it('selects the earliest bubble deterministically', () => {
    const later = { ...occupied, coordinate: { row: 2, column: 1 }, center: { x: 50, y: 20 } }
    const result = stepProjectile(
      projectile({ x: 50, y: 140 }),
      1,
      { bounds, bubbles: [later, occupied] },
      config,
    )

    expect(result.impact?.type).toBe('bubble')
    expect(result.impact?.coordinate).toEqual({ row: 1, column: 1 })
  })

  it('prioritizes a wall event before a later bubble and stops after terminal impact', () => {
    const result = stepProjectile(
      projectile({ x: 50, y: 100 }, { x: 0.8, y: -0.6 }),
      1,
      {
        bounds,
        bubbles: [{ ...occupied, center: { x: 50, y: 20 } }],
      },
      config,
    )

    expect(result.wallBounces.length).toBeGreaterThan(0)
    expect(result.impact?.type).toBe('bubble')
    expect(result.projectile.status).toBe('completed')
  })

  it('uses a bounded safeguard rather than looping forever', () => {
    const result = stepProjectile(
      projectile({ x: 50, y: 100 }, { x: -0.99, y: -0.1 }, { speed: 1000, maxCollisionIterations: 1 }),
      1,
      { bounds: { leftWallX: 0, rightWallX: 100, topY: -1000 }, bubbles: [] },
      { ...config, speed: 1000, maxCollisionIterations: 1 },
    )

    expect(result.impact?.type).toBe('safety-limit')
    expect(result.projectile.status).toBe('completed')
  })
})

describe('board collision query', () => {
  it('derives colliders from occupied grid cells without changing occupancy', () => {
    const board = new HexBoard<BubbleDescriptor>(createHexGridConfig({
      rowCount: 3,
      evenRowWidth: 3,
      oddRowWidth: 2,
      bubbleRadius: 10,
    }))
    board.place({ row: 0, column: 1 }, bubble)

    const colliders = getOccupiedBubbleColliders(board, 10)
    expect(colliders).toHaveLength(1)
    expect(colliders[0]?.coordinate).toEqual({ row: 0, column: 1 })
    expect(board.size).toBe(1)
  })
})

describe('default physics constants', () => {
  it('provide a valid projectile configuration', () => {
    expect(DEFAULT_PROJECTILE_CONFIG.speed).toBeGreaterThan(0)
    expect(DEFAULT_PROJECTILE_CONFIG.speed).toBe(1_000)
    expect(DEFAULT_PROJECTILE_CONFIG.radius).toBeGreaterThan(0)
  })
})
