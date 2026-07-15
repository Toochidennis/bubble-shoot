import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

import { APP_CONFIG } from '../config/appConfig'
import { GameLoop, createBrowserFrameScheduler } from '../game/engine/GameLoop'
import { getOccupiedBubbleColliders } from '../game/physics/collisionQueries'
import { DEFAULT_PROJECTILE_CONFIG } from '../game/physics/physicsConfig'
import type { ImpactType } from '../game/physics/types'
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
import { GameplayPresentationTimeline } from '../game/presentation/gameplayPresentationTimeline'
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
  const presentationTimelineRef = useRef(new GameplayPresentationTimeline())
  const terminalProjectileRef = useRef<import('../game/physics/types').ProjectileState | null>(null)
  const presentationAnimationFrameRef = useRef(0)
  const presentationFrameTimeRef = useRef(0)
  const startPresentationAnimationRef = useRef<(() => void) | null>(null)
  const presentationScoreRef = useRef<{ levelId: number; score: number }>({ levelId: initialLevelId, score: 0 })
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
      if (metricsRef.current.logicalWidth <= 0 || metricsRef.current.logicalHeight <= 0) return
      if (!APP_CONFIG.development.showCanvasDiagnostics) {
        drawGameplayFrame(
          context,
          metricsRef.current,
          sessionRef.current.gameplay.board,
          gameplayLayoutRef.current.boardCeilingY,
          nextSnapshot,
          getTrajectory(metricsRef.current, nextSnapshot, gameplayLayoutRef.current.projectile.radius, gameplayLayoutRef.current.boardCeilingY),
          sessionRef.current.gameplay.activeProjectile,
          [],
          {
            visualTheme: getBubbleVisualThemeForLevel(sessionRef.current.activeLevel.id),
            terminalProjectile: terminalProjectileRef.current,
            presentation: presentationTimelineRef.current.frame(),
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
        [],
      )
    }
    renderFrameRef.current = render

    presentationTimelineRef.current.reset(initialLevelId, initialViewport.height)
    presentationTimelineRef.current.setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    presentationTimelineRef.current.beginBoardEntrance()
    const animatePresentation = (time: number) => {
      const previousTime = presentationFrameTimeRef.current || time
      const deltaSeconds = Math.min(Math.max((time - previousTime) / 1000, 0), 0.05)
      presentationFrameTimeRef.current = time
      presentationTimelineRef.current.advance(deltaSeconds)
      render(sessionRef.current.gameplay.shooter.snapshot())
      if (!presentationTimelineRef.current.isPaused && presentationTimelineRef.current.hasActiveEffects) {
        presentationAnimationFrameRef.current = window.requestAnimationFrame(animatePresentation)
      } else {
        presentationAnimationFrameRef.current = 0
        presentationFrameTimeRef.current = 0
      }
    }
    const startPresentationAnimation = () => {
      if (presentationAnimationFrameRef.current === 0) {
        presentationFrameTimeRef.current = 0
        presentationAnimationFrameRef.current = window.requestAnimationFrame(animatePresentation)
      }
    }
    startPresentationAnimationRef.current = startPresentationAnimation
    startPresentationAnimation()

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

      presentationTimelineRef.current.recordProjectile(nextResult.projectileStep.projectile)
      for (const bounce of nextResult.projectileStep.wallBounces) presentationTimelineRef.current.emitWallBounce(bounce, nextResult.projectileStep.projectile.bubble)
      startPresentationAnimation()

      if (nextResult.turn !== null) {
        loop.stop()
        const turn = nextResult.turn
        terminalProjectileRef.current = turn.terminalProjectile
        setFlightStatus(turn.impact === null ? 'ready' : `impact:${turn.impact.type}`)
        presentationTimelineRef.current.emitTurn(turn, session.gameplay.board.config)
        startPresentationAnimation()
      }
      const presentedSession = session.snapshot()
      if (presentationScoreRef.current.levelId !== presentedSession.levelId) presentationScoreRef.current = { levelId: presentedSession.levelId, score: 0 }
      for (const threshold of [presentedSession.starThresholds.one, presentedSession.starThresholds.two, presentedSession.starThresholds.three]) {
        if (presentationScoreRef.current.score < threshold && presentedSession.currentRunScore >= threshold) {
          presentationTimelineRef.current.emitStarFeedback(session.gameplay.shooter.snapshot().origin)
          startPresentationAnimation()
        }
      }
      presentationScoreRef.current.score = presentedSession.currentRunScore
      setSnapshot(session.gameplay.shooter.snapshot())
      setSessionSnapshot(presentedSession)
      onSessionSnapshot?.(presentedSession)
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
      presentationTimelineRef.current.setViewportHeight(nextMetrics.logicalHeight)
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
      window.cancelAnimationFrame(presentationAnimationFrameRef.current)
      presentationAnimationFrameRef.current = 0
      startPresentationAnimationRef.current = null
      gameLoopRef.current = null
      contextRef.current = null
      renderFrameRef.current = null
    }
  }, [initialLevelId, initialViewport.height, onSessionSnapshot])

  useEffect(() => {
    const session = sessionRef.current
    if (pauseRequested) {
      const paused = session.pause()
      if (paused.ok) {
        gameLoopRef.current?.stop()
        presentationTimelineRef.current.setPaused(true)
        setSessionSnapshot(session.snapshot())
        onSessionSnapshot?.(session.snapshot())
        onPauseStateChange?.(true)
      }
      return
    }
    const resumed = session.resume()
    if (resumed.ok) {
        presentationTimelineRef.current.setPaused(false)
      setSessionSnapshot(session.snapshot())
      onSessionSnapshot?.(session.snapshot())
        onPauseStateChange?.(false)
      startPresentationAnimationRef.current?.()
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
    if (presentationTimelineRef.current.isInputBlocked) return
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
    presentationTimelineRef.current.emitAcceptedShot(sessionRef.current.gameplay.shooter.snapshot().origin, sessionRef.current.gameplay.shooter.snapshot().currentBubble)
    const nextSnapshot = sessionRef.current.gameplay.shooter.snapshot()
    setSnapshot(nextSnapshot)
    setSessionSnapshot(sessionRef.current.snapshot())
    onSessionSnapshot?.(sessionRef.current.snapshot())
    setFlightStatus('active')
    renderFrameRef.current?.(nextSnapshot)
    startPresentationAnimationRef.current?.()
    gameLoopRef.current?.start()
  }

  const resetLevelView = useCallback((levelId: number) => {
    gameLoopRef.current?.stop()
    window.cancelAnimationFrame(presentationAnimationFrameRef.current)
    presentationAnimationFrameRef.current = 0
    presentationTimelineRef.current.reset(levelId, metricsRef.current.logicalHeight || initialViewport.height)
    presentationTimelineRef.current.beginBoardEntrance()
    terminalProjectileRef.current = null
    presentationScoreRef.current = { levelId, score: 0 }
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
    presentationFrameTimeRef.current = 0
    startPresentationAnimationRef.current?.()
  }, [initialViewport.height, onSessionSnapshot])

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
