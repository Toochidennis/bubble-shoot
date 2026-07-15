import { describe, expect, it } from 'vitest'

import { createDefaultShooterConfig } from './shooterConfig'
import { ShooterState } from './ShooterState'

const viewport = { width: 400, height: 800, pixelRatio: 1 }

describe('ShooterState', () => {
  it('starts with current/next bubbles and a viewport-derived origin', () => {
    const shooter = new ShooterState(createDefaultShooterConfig(viewport))
    const snapshot = shooter.snapshot()

    expect(snapshot.origin).toEqual({ x: 200, y: 728 })
    expect(snapshot.currentBubble).toEqual({ color: 'purple' })
    expect(snapshot.nextBubble).toEqual({ color: 'yellow' })
    expect(snapshot.inputLocked).toBe(false)
    expect(snapshot.fireRequested).toBe(false)
  })

  it('updates aim while enabled and ignores aim changes while locked', () => {
    const shooter = new ShooterState(createDefaultShooterConfig(viewport))

    expect(shooter.updateAimFromPointer({ x: 0, y: 0 })).toBe(true)
    expect(shooter.snapshot().aimDirection.x).toBeLessThan(0)

    shooter.setInputLocked(true)
    const previousAngle = shooter.snapshot().aimAngleRadians

    expect(shooter.updateAimFromPointer({ x: 400, y: 0 })).toBe(false)
    expect(shooter.snapshot().aimAngleRadians).toBe(previousAngle)
  })

  it('keeps the current bubble fixed at the shooter origin while aim changes', () => {
    const shooter = new ShooterState(createDefaultShooterConfig(viewport))
    const origin = shooter.snapshot().origin
    shooter.updateAimFromPointer({ x: 0, y: 320 })
    const left = shooter.snapshot()
    shooter.updateAimFromPointer({ x: 400, y: 320 })
    const right = shooter.snapshot()
    expect(left.origin).toEqual(origin)
    expect(right.origin).toEqual(origin)
    expect(left.aimDirection.x).toBeLessThan(0)
    expect(right.aimDirection.x).toBeGreaterThan(0)
  })

  it('passes the same authoritative direction to the accepted fire request', () => {
    const shooter = new ShooterState(createDefaultShooterConfig(viewport))
    shooter.setAimAngle(0.2)
    const aimed = shooter.snapshot()
    const fired = shooter.requestFire()
    expect(fired.accepted).toBe(true)
    if (fired.accepted) expect(fired.aimDirection).toEqual(aimed.aimDirection)
  })

  it('accepts only one fire request and creates no projectile', () => {
    const shooter = new ShooterState(createDefaultShooterConfig(viewport))
    const first = shooter.requestFire()
    const second = shooter.requestFire()

    expect(first.accepted).toBe(true)
    expect(second).toEqual({ accepted: false, reason: 'fire-request-pending' })
    expect(shooter.snapshot().fireRequested).toBe(true)
    expect(shooter.snapshot().inputLocked).toBe(true)
  })

  it('requires explicit reset/unlock before a later future fire request', () => {
    const shooter = new ShooterState(createDefaultShooterConfig(viewport))

    shooter.requestFire()
    shooter.clearFireRequest()
    expect(shooter.requestFire()).toEqual({ accepted: false, reason: 'input-locked' })

    shooter.unlockInput()
    expect(shooter.requestFire().accepted).toBe(true)
  })

  it('updates the logical origin when the viewport changes', () => {
    const shooter = new ShooterState(createDefaultShooterConfig(viewport))

    shooter.setViewport({ width: 300, height: 600, pixelRatio: 2 })

    expect(shooter.snapshot().origin).toEqual({ x: 150, y: 528 })
  })
})
