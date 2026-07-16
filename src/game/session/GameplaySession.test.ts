import { describe, expect, it } from 'vitest'

import { HexBoard } from '../grid/HexBoard'
import { createHexGridConfig } from '../grid/gridConfig'
import { getOccupiedBubbleColliders } from '../physics/collisionQueries'
import { DEFAULT_PROJECTILE_CONFIG } from '../physics/physicsConfig'
import { ProjectileManager } from '../physics/ProjectileManager'
import { createDefaultShooterConfig } from '../shooter/shooterConfig'
import { ShooterState } from '../shooter/ShooterState'
import type { BubbleColor, BubbleDescriptor } from '../shooter/types'
import { DeterministicBubbleSource } from './bubbleSource'
import { GameplaySession } from './GameplaySession'
import type { GameplayLifecycleState } from './types'

const boardConfig = createHexGridConfig({
  rowCount: 8,
  evenRowWidth: 7,
  oddRowWidth: 6,
  bubbleRadius: 14,
  origin: { x: 100, y: 0 },
})
const viewport = { width: 200, height: 400, pixelRatio: 1 }
const origin = { x: 100, y: 328 }
const at = (row: number, column: number) => ({ row, column })
const bubble = (color: BubbleColor): BubbleDescriptor => ({ color })

function createSession(entries: Array<[{ row: number; column: number }, BubbleColor]> = []) {
  const board = new HexBoard<BubbleDescriptor>(boardConfig)
  for (const [coordinate, color] of entries) {
    expect(board.place(coordinate, bubble(color)).ok).toBe(true)
  }
  return new GameplaySession(
    board,
    new ShooterState(createDefaultShooterConfig(viewport)),
    new ProjectileManager(DEFAULT_PROJECTILE_CONFIG),
    new DeterministicBubbleSource([{ color: 'blue' }, { color: 'green' }, { color: 'red' }]),
  )
}

function environment(session: GameplaySession) {
  return {
    bounds: { leftWallX: 0, rightWallX: viewport.width, topY: 0 },
    bubbles: getOccupiedBubbleColliders(session.board, DEFAULT_PROJECTILE_CONFIG.radius),
  }
}

function runUntilComplete(session: GameplaySession): void {
  for (let index = 0; index < 30 && session.state === 'SHOOTING'; index += 1) {
    session.step(0.25, environment(session))
  }
  expect(session.state).toBe('AIMING')
}

describe('gameplay session lifecycle', () => {
  it('starts in aiming and rejects invalid direct transitions', () => {
    const session = createSession()
    expect(session.state).toBe('AIMING')
    expect(session.transition('MATCHING')).toEqual({ ok: false, reason: 'invalid-transition' })
    expect(session.transition('SNAPPING')).toEqual({ ok: false, reason: 'invalid-transition' })
  })

  it('accepts exactly one fire and owns one projectile until terminal handoff', () => {
    const session = createSession()
    expect(session.requestFire(origin)).toMatchObject({ accepted: true, projectileId: 'projectile-1' })
    expect(session.state).toBe('SHOOTING')
    expect(session.requestFire(origin)).toEqual({ accepted: false, reason: 'not-aiming' })
    expect(session.snapshot().activeProjectile).toBe(true)
  })

  it('completes a no-match turn, skips floating, advances bubbles once, and unlocks aiming', () => {
    const session = createSession()
    expect(session.requestFire(origin).accepted).toBe(true)
    runUntilComplete(session)
    const result = session.lastTurnResult
    expect(result).toMatchObject({ completed: true, reason: 'completed', floating: null })
    expect(result?.match).toMatchObject({ ok: true, matched: false })
    expect(session.state).toBe('AIMING')
    expect(session.shooter.snapshot().inputLocked).toBe(false)
    expect(session.projectileManager.active).toBeNull()
    expect(session.currentBubble).toEqual(bubble('yellow'))
    expect(session.nextBubble).toEqual(bubble('blue'))
  })

  it('runs the successful match and floating stages in order', () => {
    const session = createSession([
      [at(0, 0), 'purple'],
      [at(0, 1), 'purple'],
      [at(2, 3), 'red'],
    ])
    expect(session.requestFire(origin).accepted).toBe(true)
    runUntilComplete(session)
    const result = session.lastTurnResult
    expect(result?.match).toMatchObject({ ok: true, matched: true })
    expect(result?.floating).not.toBeNull()
    expect(result?.floating?.removedAny).toBe(true)
    expect(session.board.isOccupied(at(2, 3))).toBe(false)
    expect(session.snapshot().transitionHistory).toEqual([
      'INITIALIZING', 'AIMING', 'SHOOTING', 'SNAPPING', 'MATCHING',
      'RESOLVING_FLOATING', 'TURN_COMPLETE', 'AIMING',
    ])
  })

  it('handles controlled snap failure without deadlock or permanent lock', () => {
    const session = createSession()
    for (const cell of session.board.getValidCells()) {
      if (!cell.occupied) {
        session.board.place(cell.coordinate, bubble('red'))
      }
    }
    const boardSizeBeforeShot = session.board.size
    expect(session.requestFire(origin).accepted).toBe(true)
    runUntilComplete(session)
    expect(session.lastTurnResult?.reason).toBe('snap-failure')
    expect(session.lastTurnResult?.terminalProjectile).toMatchObject({
      status: 'completed',
      bubble: session.lastTurnResult?.firedBubble,
    })
    expect(session.board.size).toBe(boardSizeBeforeShot)
    expect(session.state).toBe('AIMING')
    expect(session.shooter.snapshot().inputLocked).toBe(false)
  })

  it('pauses and resumes aiming and projectile flight without logical advancement', () => {
    const session = createSession()
    expect(session.pause()).toEqual({ ok: true })
    expect(session.state).toBe('PAUSED')
    expect(session.resume()).toEqual({ ok: true, state: 'AIMING' })
    expect(session.requestFire(origin).accepted).toBe(true)
    const before = session.projectileManager.active?.position
    expect(session.pause()).toEqual({ ok: true })
    expect(session.step(0.25, environment(session))).toBeNull()
    expect(session.projectileManager.active?.position).toEqual(before)
    expect(session.pause()).toEqual({ ok: false, reason: 'unsupported-pause' })
    expect(session.resume()).toEqual({ ok: true, state: 'SHOOTING' })
    expect(session.step(0.25, environment(session))?.projectileStep.deltaSeconds).toBe(0.25)
  })

  it('supports repeated completed turns without stale projectile or shooter lock', () => {
    const session = createSession()
    const states: GameplayLifecycleState[] = []
    for (let turn = 0; turn < 3; turn += 1) {
      expect(session.requestFire(origin).accepted).toBe(true)
      runUntilComplete(session)
      states.push(session.state)
      expect(session.projectileManager.active).toBeNull()
      expect(session.shooter.snapshot().inputLocked).toBe(false)
    }
    expect(states).toEqual(['AIMING', 'AIMING', 'AIMING'])
    expect(session.snapshot().turnNumber).toBe(3)
  })

  it('can suppress next-bubble generation when the level layer has completed', () => {
    let generated = 0
    const board = new HexBoard<BubbleDescriptor>(boardConfig)
    const session = new GameplaySession(
      board,
      new ShooterState(createDefaultShooterConfig(viewport)),
      new ProjectileManager(DEFAULT_PROJECTILE_CONFIG),
      { next: () => { generated += 1; return bubble('blue') } },
      () => false,
    )
    expect(session.requestFire(origin).accepted).toBe(true)
    runUntilComplete(session)
    expect(generated).toBe(0)
  })
})
