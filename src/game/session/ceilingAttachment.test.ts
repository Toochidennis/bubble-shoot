import { describe, expect, it } from 'vitest'

import { HexBoard } from '../grid/HexBoard'
import { getOccupiedBubbleColliders } from '../physics/collisionQueries'
import { ProjectileManager } from '../physics/ProjectileManager'
import { createGameplayLayout } from '../layout/gameplayLayout'
import { getCuratedLevel } from '../levels/curatedLevels'
import { createDefaultShooterConfig } from '../shooter/shooterConfig'
import { ShooterState } from '../shooter/ShooterState'
import type { BubbleColor, BubbleDescriptor } from '../shooter/types'
import { GameplaySession } from './GameplaySession'
import { LevelSession } from '../levels/LevelSession'

const viewport = { width: 320, height: 640, pixelRatio: 1 }
const layout = createGameplayLayout(viewport)

function source(sequence: readonly BubbleColor[]) {
  let index = 0
  return {
    next(): BubbleDescriptor {
      const color = sequence[Math.min(index, sequence.length - 1)] ?? 'blue'
      index += 1
      return { color }
    },
    get calls(): number { return index },
  }
}

function createSession(colors: readonly BubbleColor[] = ['red', 'green', 'blue']): { session: GameplaySession; bubbles: ReturnType<typeof source> } {
  const bubbles = source(colors)
  const board = new HexBoard<BubbleDescriptor>(layout.grid)
  const shooter = new ShooterState({
    ...createDefaultShooterConfig(viewport),
    bottomInset: layout.shooterBottomInset,
    currentBubble: { color: colors[0] ?? 'red' },
    nextBubble: { color: colors[1] ?? 'green' },
  })
  return {
    bubbles,
    session: new GameplaySession(
      board,
      shooter,
      new ProjectileManager(layout.projectile),
      bubbles,
    ),
  }
}

function environment(session: GameplaySession) {
  return {
    bounds: { leftWallX: 0, rightWallX: viewport.width, topY: layout.boardCeilingY },
    bubbles: getOccupiedBubbleColliders(session.board, layout.projectile.radius),
  }
}

function runToTurn(session: GameplaySession) {
  for (let index = 0; index < 80 && session.state === 'SHOOTING'; index += 1) {
    const result = session.step(0.05, environment(session))
    if (result?.turn !== null && result?.turn !== undefined) return result.turn
  }
  throw new Error('Projectile did not reach a terminal turn result.')
}

function runToTurnWithBounces(session: GameplaySession) {
  const wallBounces: Array<'left' | 'right'> = []
  for (let index = 0; index < 80 && session.state === 'SHOOTING'; index += 1) {
    const result = session.step(0.05, environment(session))
    if (result !== null) wallBounces.push(...result.projectileStep.wallBounces.map((bounce) => bounce.wall))
    if (result?.turn !== null && result?.turn !== undefined) return { turn: result.turn, wallBounces }
  }
  throw new Error('Projectile did not reach a terminal turn result.')
}

describe('normal ceiling attachment lifecycle', () => {
  it('snaps a direct no-match ceiling shot and keeps the fired bubble on the board', () => {
    const { session, bubbles } = createSession(['red', 'green', 'blue'])
    expect(session.requestFire(session.shooter.snapshot().origin).accepted).toBe(true)

    const result = runToTurn(session)

    expect(result.impact?.type).toBe('ceiling')
    expect(result.snap?.ok).toBe(true)
    expect(result.match).toMatchObject({ ok: true, matched: false })
    expect(session.board.size).toBe(1)
    expect(result.snap?.ok && session.board.getOccupancy(result.snap.coordinate)).toEqual({ color: 'red' })
    expect(session.projectileManager.active).toBeNull()
    expect(session.shooter.snapshot().inputLocked).toBe(false)
    expect(bubbles.calls).toBe(1)
  })

  it.each([
    ['left-wall-bounce', -0.38 * Math.PI],
    ['right-wall-bounce', 0.38 * Math.PI],
  ])('%s reaches the ceiling and attaches to a top-row cell', (_name, angle) => {
    const { session } = createSession(['green', 'blue', 'red'])
    expect(session.shooter.setAimAngle(angle)).toBe(true)
    expect(session.requestFire(session.shooter.snapshot().origin).accepted).toBe(true)

    const { turn: result, wallBounces } = runToTurnWithBounces(session)

    expect(result.impact?.type).toBe('ceiling')
    expect(result.snap?.ok).toBe(true)
    expect(result.snap?.ok && result.snap.coordinate.row).toBe(0)
    expect(wallBounces.length).toBeGreaterThan(0)
    expect(session.board.size).toBe(1)
    expect(result.match?.matched).toBe(false)
  })

  it.each(['blue', 'green', 'purple', 'red', 'yellow'] as BubbleColor[])('preserves %s identity through fire, snap, and match read', (color) => {
    const { session } = createSession([color, 'blue', 'green'])
    expect(session.requestFire(session.shooter.snapshot().origin)).toEqual({
      accepted: true,
      projectileId: 'projectile-1',
      bubble: { color },
    })

    const result = runToTurn(session)

    expect(result.firedBubble).toEqual({ color })
    expect(result.terminalProjectile).toBeNull()
    expect(result.snap?.ok).toBe(true)
    expect(result.snap?.ok && session.board.getOccupancy(result.snap.coordinate)).toEqual({ color })
    expect(result.match).toMatchObject({ bubble: { color } })
  })
})

describe('LevelSession ceiling attachment integration', () => {
  it('consumes one shot and completes a no-match ceiling placement without stale projectile state', () => {
    const session = new LevelSession(1, viewport, undefined, layout)
    for (const cell of session.gameplay.board.getOccupiedCells()) session.gameplay.board.remove(cell.coordinate)
    const before = session.gameplay.board.size
    const origin = session.gameplay.shooter.snapshot().origin

    expect(session.requestFire(origin).accepted).toBe(true)
    expect(session.shotsUsedCount).toBe(1)
    expect(session.requestFire(origin)).toEqual({ accepted: false, reason: 'not-aiming' })

    for (let index = 0; index < 80 && session.gameplay.state === 'SHOOTING'; index += 1) {
      session.step(0.05, {
        bounds: { leftWallX: 0, rightWallX: viewport.width, topY: layout.boardCeilingY },
        bubbles: getOccupiedBubbleColliders(session.gameplay.board, layout.projectile.radius),
      })
    }

    expect(session.gameplay.lastTurnResult?.snap?.ok).toBe(true)
    expect(session.gameplay.lastTurnResult?.match?.matched).toBe(false)
    expect(session.gameplay.board.size).toBe(before + 1)
    expect(session.shotsUsedCount).toBe(1)
    expect(session.gameplay.activeProjectile).toBeNull()
    expect(session.gameplay.state).toBe('AIMING')
  })

  it('keeps a Level 6 full-width edge shot when row 0 is already full', () => {
    const levelViewport = { width: 430, height: 784, pixelRatio: 1 }
    const levelLayout = createGameplayLayout(levelViewport)
    const level = getCuratedLevel(6)
    if (level === undefined) {
      throw new Error('Expected curated Level 6.')
    }

    const targetBoard = new HexBoard<BubbleDescriptor>(levelLayout.grid)
    for (const placement of level.startingBubbles) {
      targetBoard.place(placement.coordinate, {
        color: placement.color,
        ...(placement.marked === undefined ? {} : { marked: placement.marked }),
      })
    }
    expect(
      targetBoard
        .getValidCells()
        .filter((cell) => cell.coordinate.row === 0)
        .every((cell) => cell.occupied),
    ).toBe(true)

    const bubbles = source(['blue'])
    const shooter = new ShooterState({
      ...createDefaultShooterConfig(levelViewport),
      bottomInset: levelLayout.shooterBottomInset,
      currentBubble: { color: 'red' },
      nextBubble: { color: 'green' },
    })
    const session = new GameplaySession(
      targetBoard,
      shooter,
      new ProjectileManager(levelLayout.projectile),
      bubbles,
    )
    const before = targetBoard.size

    expect(shooter.setAimAngle(0.25)).toBe(true)
    expect(session.requestFire(shooter.snapshot().origin).accepted).toBe(true)

    let result = null as ReturnType<typeof session.step>
    for (let index = 0; index < 100 && session.state === 'SHOOTING'; index += 1) {
      result = session.step(0.05, {
        bounds: {
          leftWallX: 0,
          rightWallX: levelViewport.width,
          topY: levelLayout.boardCeilingY,
        },
        bubbles: getOccupiedBubbleColliders(targetBoard, levelLayout.projectile.radius),
      })
    }

    const turn = result?.turn ?? session.lastTurnResult
    expect(turn?.impact?.type).toBe('bubble')
    expect(turn?.snap?.ok).toBe(true)
    if (turn?.snap?.ok) {
      expect(turn.snap.coordinate.row).toBeGreaterThan(0)
      expect(targetBoard.getOccupancy(turn.snap.coordinate)).toEqual({ color: 'red' })
      expect(
        targetBoard
          .getNeighbors(turn.snap.coordinate)
          .some((coordinate) => targetBoard.isOccupied(coordinate)),
      ).toBe(true)
    }
    expect(targetBoard.size).toBe(before + 1)
    expect(session.currentBubble).toEqual({ color: 'green' })
    expect(session.activeProjectile).toBeNull()
    expect(session.state).toBe('AIMING')
    expect(bubbles.calls).toBe(1)
  })
})
