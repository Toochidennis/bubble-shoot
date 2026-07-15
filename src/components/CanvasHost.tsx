import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

import { APP_CONFIG } from '../config/appConfig'
import { GameLoop, createBrowserFrameScheduler } from '../game/engine/GameLoop'
import { getOccupiedBubbleColliders } from '../game/physics/collisionQueries'
import { DEFAULT_PROJECTILE_CONFIG } from '../game/physics/physicsConfig'
import type { ImpactType } from '../game/physics/types'
import type { FallingBubbleVisual, FloatingResolutionResult } from '../game/floating/types'
import {
  applyCanvasMetrics,
  calculateCanvasMetrics,
  type CanvasMetrics,
} from '../game/rendering/canvasMetrics'
import { drawGameplayFrame } from '../game/rendering/drawGameplayFrame'
import { getBubbleVisualThemeForLevel } from '../game/rendering/bubbleVisualTheme'
import { drawShooterDebugFrame } from '../game/rendering/drawShooterDebug'
import { clientPointToLogicalPoint } from '../game/shooter/pointerInput'
import { predictTrajectory, type TrajectoryPreview } from '../game/shooter/trajectory'
import { ShooterState } from '../game/shooter/ShooterState'
import { createDefaultShooterConfig } from '../game/shooter/shooterConfig'
import { AimPointerController } from '../game/shooter/aimPointerController'
import type { ShooterStateSnapshot } from '../game/shooter/types'
import { LevelSession } from '../game/levels/LevelSession'
import { createGameplayLayout } from '../game/layout/gameplayLayout'
import { GameIcon } from './GameIcon'
import type { LevelSessionSnapshot } from '../game/levels/LevelSession'
import type { ProgressionRepository } from '../game/progression/ProgressionRepository'

const INITIAL_METRICS: CanvasMetrics = {
  width: 0,
  height: 0,
  logicalWidth: 0,
  logicalHeight: 0,
  backingWidth: 0,
  backingHeight: 0,
  pixelRatio: 1,
}

function getInitialViewport() {
  if (typeof window === 'undefined') return { width: 320, height: 560, pixelRatio: 1 }
  return {
    width: Math.max(224, Math.min(672, window.innerWidth)),
    height: Math.max(480, window.innerHeight),
    pixelRatio: Math.min(window.devicePixelRatio || 1, APP_CONFIG.canvas.maxDevicePixelRatio),
  }
}

function getTrajectory(
  metrics: CanvasMetrics,
  snapshot: ShooterStateSnapshot,
  projectileRadius: number,
  boardCeilingY: number,
): TrajectoryPreview {
  return predictTrajectory(snapshot.origin, snapshot.aimDirection, {
    leftWallX: projectileRadius,
    rightWallX: Math.max(metrics.logicalWidth - projectileRadius, projectileRadius + 1),
    topY: boardCeilingY + projectileRadius,
    maxDistance: Math.max(metrics.logicalHeight * 2, 400),
    maxSegments: 8,
  })
}

function getPhysicsBounds(metrics: CanvasMetrics, boardCeilingY: number) {
  return {
    leftWallX: 0,
    rightWallX: Math.max(metrics.logicalWidth, DEFAULT_PROJECTILE_CONFIG.radius * 2 + 1),
    topY: boardCeilingY,
  }
}

interface CanvasHostProps {
  readonly initialLevelId?: number
  readonly onHome?: () => void
  readonly onSessionSnapshot?: (snapshot: LevelSessionSnapshot) => void
  readonly pauseRequested?: boolean
  readonly restartRequest?: number
  readonly onPauseStateChange?: (paused: boolean) => void
  readonly progression?: ProgressionRepository
}

export function CanvasHost({ initialLevelId = 1, onHome, onSessionSnapshot, pauseRequested = false, restartRequest = 0, onPauseStateChange, progression }: CanvasHostProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const renderFrameRef = useRef<((nextSnapshot: ShooterStateSnapshot) => void) | null>(null)
  const metricsRef = useRef<CanvasMetrics>(INITIAL_METRICS)
  const initialViewport = getInitialViewport()
  const initialGameplayLayout = createGameplayLayout(initialViewport)
  const gameplayLayoutRef = useRef(initialGameplayLayout)
  const sessionRef = useRef<LevelSession>(new LevelSession(initialLevelId, initialViewport, progression, initialGameplayLayout))
  const fallingBubblesRef = useRef<FallingBubbleVisual[]>([])
  const terminalProjectileRef = useRef<import('../game/physics/types').ProjectileState | null>(null)
  const fallingAnimationFrameRef = useRef(0)
  const fallingFrameTimeRef = useRef(0)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const aimPointerRef = useRef(new AimPointerController())
  const [metrics, setMetrics] = useState<CanvasMetrics>(INITIAL_METRICS)
  const [snapshot, setSnapshot] = useState<ShooterStateSnapshot>(() => new ShooterState({ ...createDefaultShooterConfig(initialViewport), bottomInset: initialGameplayLayout.shooterBottomInset }).snapshot())
  const [sessionSnapshot, setSessionSnapshot] = useState<LevelSessionSnapshot | null>(null)
  const [flightStatus, setFlightStatus] = useState<'ready' | 'active' | `impact:${ImpactType}`>('ready')

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return undefined
    }

    const context = canvas.getContext('2d')
    if (context === null) {
      throw new Error('Canvas 2D is not supported by this browser.')
    }
    contextRef.current = context

    const render = (nextSnapshot: ShooterStateSnapshot) => {
      if (!APP_CONFIG.development.showCanvasDiagnostics) {
        drawGameplayFrame(
          context,
          metricsRef.current,
          sessionRef.current.gameplay.board,
          gameplayLayoutRef.current.boardCeilingY,
          nextSnapshot,
          getTrajectory(metricsRef.current, nextSnapshot, gameplayLayoutRef.current.projectile.radius, gameplayLayoutRef.current.boardCeilingY),
          sessionRef.current.gameplay.activeProjectile,
          fallingBubblesRef.current,
          {
            visualTheme: getBubbleVisualThemeForLevel(sessionRef.current.activeLevel.id),
            terminalProjectile: terminalProjectileRef.current,
          },
        )
        return
      }
      drawShooterDebugFrame(
        context,
        metricsRef.current,
        sessionRef.current.gameplay.board,
        nextSnapshot,
        getTrajectory(metricsRef.current, nextSnapshot, gameplayLayoutRef.current.projectile.radius, gameplayLayoutRef.current.boardCeilingY),
        sessionRef.current.gameplay.activeProjectile,
        sessionRef.current.gameplay.lastTurnResult?.impact ?? sessionRef.current.gameplay.completedImpact,
        sessionRef.current.gameplay.lastTurnResult?.snap ?? null,
        sessionRef.current.gameplay.lastTurnResult?.match ?? null,
        fallingBubblesRef.current,
      )
    }
    renderFrameRef.current = render

    const animateFalling = (time: number) => {
      const previousTime = fallingFrameTimeRef.current || time
      const deltaSeconds = Math.min(Math.max((time - previousTime) / 1000, 0), 0.05)
      fallingFrameTimeRef.current = time
      fallingBubblesRef.current = fallingBubblesRef.current
        .map((falling) => ({
          ...falling,
          position: {
            x: falling.position.x + falling.driftX * deltaSeconds,
            y: falling.position.y + falling.velocityY * deltaSeconds,
          },
          velocityY: falling.velocityY + 420 * deltaSeconds,
        }))
        .filter((falling) => falling.position.y < metricsRef.current.logicalHeight + 32)
      render(sessionRef.current.gameplay.shooter.snapshot())
      if (fallingBubblesRef.current.length > 0) {
        fallingAnimationFrameRef.current = window.requestAnimationFrame(animateFalling)
      } else {
        fallingAnimationFrameRef.current = 0
      }
    }

    const startFallingAnimation = (result: FloatingResolutionResult) => {
      fallingBubblesRef.current = result.removedBubbles.map((removed, index) => ({
        id: `${removed.coordinate.row}:${removed.coordinate.column}`,
        bubble: removed.bubble,
        coordinate: removed.coordinate,
        position: removed.center,
        velocityY: 45 + index * 12,
        driftX: index % 2 === 0 ? -12 : 12,
      }))
      window.cancelAnimationFrame(fallingAnimationFrameRef.current)
      fallingFrameTimeRef.current = 0
      if (fallingBubblesRef.current.length > 0) {
        fallingAnimationFrameRef.current = window.requestAnimationFrame(animateFalling)
      }
    }

    const loop = new GameLoop(createBrowserFrameScheduler(), (frame) => {
      const session = sessionRef.current
      const nextResult = session.step(frame.deltaMs / 1000, {
        bounds: getPhysicsBounds(metricsRef.current, gameplayLayoutRef.current.boardCeilingY),
        bubbles: getOccupiedBubbleColliders(
          session.gameplay.board,
          gameplayLayoutRef.current.projectile.radius,
        ),
      })
      if (nextResult === null) {
        if (session.gameplay.state !== 'SHOOTING') {
          loop.stop()
        }
        return
      }

      if (nextResult.turn !== null) {
        loop.stop()
        const turn = nextResult.turn
        terminalProjectileRef.current = turn.terminalProjectile
        setFlightStatus(turn.impact === null ? 'ready' : `impact:${turn.impact.type}`)
        if (turn.floating?.removedAny) {
          startFallingAnimation(turn.floating)
        }
      }
      setSnapshot(session.gameplay.shooter.snapshot())
      setSessionSnapshot(session.snapshot())
      onSessionSnapshot?.(session.snapshot())
      render(session.gameplay.shooter.snapshot())
    })
    gameLoopRef.current = loop

    let resizeFrame = 0
    const resize = () => {
      window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(() => {
        const bounds = canvas.getBoundingClientRect()
        const nextMetrics = calculateCanvasMetrics(
          bounds.width,
          bounds.height,
          window.devicePixelRatio,
          APP_CONFIG.canvas.maxDevicePixelRatio,
        )
        applyCanvasMetrics(canvas, context, nextMetrics)
        sessionRef.current.gameplay.shooter.setViewport({
          width: nextMetrics.logicalWidth,
          height: nextMetrics.logicalHeight,
          pixelRatio: nextMetrics.pixelRatio,
        })
        metricsRef.current = nextMetrics
        const nextSnapshot = sessionRef.current.gameplay.shooter.snapshot()
        render(nextSnapshot)
        setMetrics(nextMetrics)
        setSnapshot(nextSnapshot)
        setSessionSnapshot(sessionRef.current.snapshot())
        onSessionSnapshot?.(sessionRef.current.snapshot())
      })
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    window.addEventListener('orientationchange', resize)
    resize()

    return () => {
      observer.disconnect()
      window.removeEventListener('orientationchange', resize)
      window.cancelAnimationFrame(resizeFrame)
      loop.stop()
      window.cancelAnimationFrame(fallingAnimationFrameRef.current)
      fallingAnimationFrameRef.current = 0
      gameLoopRef.current = null
      contextRef.current = null
      renderFrameRef.current = null
    }
  }, [onSessionSnapshot])

  useEffect(() => {
    const session = sessionRef.current
    if (pauseRequested) {
      const paused = session.pause()
      if (paused.ok) {
        gameLoopRef.current?.stop()
        setSessionSnapshot(session.snapshot())
        onSessionSnapshot?.(session.snapshot())
        onPauseStateChange?.(true)
      }
      return
    }
    const resumed = session.resume()
    if (resumed.ok) {
      setSessionSnapshot(session.snapshot())
      onSessionSnapshot?.(session.snapshot())
      onPauseStateChange?.(false)
      if (resumed.state === 'SHOOTING') gameLoopRef.current?.start()
    }
  }, [pauseRequested, onPauseStateChange, onSessionSnapshot])

  const getPointerPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return null
    }
    return clientPointToLogicalPoint(
      { clientX: event.clientX, clientY: event.clientY },
      canvas.getBoundingClientRect(),
      metricsRef.current,
    )
  }

  const updateAim = (event: PointerEvent<HTMLCanvasElement>, requireCapturedPointer = false) => {
    event.preventDefault()
    if (requireCapturedPointer && !aimPointerRef.current.accepts(event.pointerId)) return
    if (!requireCapturedPointer && !aimPointerRef.current.accepts(event.pointerId) && event.pointerType !== 'mouse') return
    const context = contextRef.current
    const point = getPointerPoint(event)
    if (context === null || point === null || !sessionRef.current.updateAim(point)) {
      return
    }

    const nextSnapshot = sessionRef.current.gameplay.shooter.snapshot()
    setSnapshot(nextSnapshot)
    renderFrameRef.current?.(nextSnapshot)
  }

  const beginAim = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!aimPointerRef.current.begin(event.pointerId)) return
    if (!sessionRef.current.updateAim(getPointerPoint(event) ?? sessionRef.current.gameplay.shooter.snapshot().origin)) {
      aimPointerRef.current.cancel(event.pointerId)
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    updateAim(event, true)
  }

  const cancelAim = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!aimPointerRef.current.cancel(event.pointerId)) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const fireFromPointerRelease = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!aimPointerRef.current.accepts(event.pointerId)) return
    event.preventDefault()
    updateAim(event, true)
    aimPointerRef.current.end(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)

    const fireRequest = sessionRef.current.requestFire(sessionRef.current.gameplay.shooter.snapshot().origin)
    if (!fireRequest.accepted) {
      return
    }

    terminalProjectileRef.current = null
    const nextSnapshot = sessionRef.current.gameplay.shooter.snapshot()
    setSnapshot(nextSnapshot)
    setSessionSnapshot(sessionRef.current.snapshot())
    onSessionSnapshot?.(sessionRef.current.snapshot())
    setFlightStatus('active')
    renderFrameRef.current?.(nextSnapshot)
    gameLoopRef.current?.start()
  }

  const resetLevelView = useCallback((levelId: number) => {
    gameLoopRef.current?.stop()
    window.cancelAnimationFrame(fallingAnimationFrameRef.current)
    fallingAnimationFrameRef.current = 0
    fallingBubblesRef.current = []
    terminalProjectileRef.current = null
    const loaded = APP_CONFIG.development.showCanvasDiagnostics
      ? sessionRef.current.loadDevelopmentLevel(levelId)
      : sessionRef.current.loadLevel(levelId)
    if (!loaded.ok) {
      return
    }
    const nextSnapshot = sessionRef.current.gameplay.shooter.snapshot()
    setSnapshot(nextSnapshot)
    setSessionSnapshot(sessionRef.current.snapshot())
    onSessionSnapshot?.(sessionRef.current.snapshot())
    setFlightStatus('ready')
  }, [onSessionSnapshot])

  const restartLevel = () => {
    resetLevelView(sessionRef.current.activeLevel.id)
  }

  // Restart requests are edge-triggered by the React screen shell.
  useEffect(() => {
    if (restartRequest === 0) return
    resetLevelView(initialLevelId)
  }, [restartRequest, initialLevelId, resetLevelView])

  return (
    <figure className="canvas-frame">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label="Gameplay Canvas foundation"
        onPointerMove={(event) => updateAim(event)}
        onPointerDown={beginAim}
        onPointerUp={fireFromPointerRelease}
        onPointerCancel={cancelAim}
      >
        Your browser does not support HTML5 Canvas.
      </canvas>
      {APP_CONFIG.development.showCanvasDiagnostics ? <figcaption aria-live="polite">
        {APP_CONFIG.development.showCanvasDiagnostics ? 'Physics debug ready' : 'Canvas ready'} ·{' '}
        {Math.round(metrics.logicalWidth)} × {Math.round(metrics.logicalHeight)} logical pixels ·{' '}
        {metrics.pixelRatio}× DPR · {snapshot.inputLocked ? 'input locked' : 'aim ready'} · flight {flightStatus} · level {sessionSnapshot?.displayNumber ?? 1} · score {sessionSnapshot?.currentRunScore ?? 0} · last turn {sessionSnapshot?.lastTurnScore?.total ?? 0} · stars {sessionSnapshot?.earnedStars ?? 0} · best {sessionSnapshot?.bestScore ?? 0}/{sessionSnapshot?.bestStars ?? 0} · unlocked through {sessionSnapshot?.highestUnlockedLevel ?? 1} · {sessionSnapshot?.levelUnlocked ? 'unlocked' : 'locked'} · mission {sessionSnapshot?.mission.remainingBubbleCount ?? 0} remaining · shots {sessionSnapshot?.shotsRemaining ?? 0} · {sessionSnapshot?.status ?? 'ACTIVE'} · state {sessionSnapshot?.gameplay.state ?? 'AIMING'} · turn {sessionSnapshot?.gameplay.turnNumber ?? 0}{sessionSnapshot?.contentInvariant ? ` · INVARIANT ${sessionSnapshot.contentInvariant.type} level ${sessionSnapshot.contentInvariant.levelId} turn ${sessionSnapshot.contentInvariant.processedTurnNumber}` : ''}
      </figcaption> : null}
      {onHome ? <button type="button" className="gameplay-home-button" onClick={onHome}><GameIcon name="back" size={18} /> Home</button> : null}
      {APP_CONFIG.development.showCanvasDiagnostics ? (
        <div className="development-level-controls" aria-label="Development level controls">
          <label>
            Level
            <select
              value={sessionSnapshot?.levelId ?? 1}
              onChange={(event) => resetLevelView(Number(event.target.value))}
            >
              {Array.from({ length: 15 }, (_, index) => index + 1).map((levelId) => (
                <option key={levelId} value={levelId}>{levelId}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={restartLevel}>Restart level</button>
        </div>
      ) : null}
    </figure>
  )
}
