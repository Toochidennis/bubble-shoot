import { useCallback, useEffect, useRef, useState } from 'react'

import { CanvasHost } from '../components/CanvasHost'
import { GameIcon } from '../components/GameIcon'
import type { ProgressionRepository } from '../game/progression/ProgressionRepository'
import type { LevelSessionSnapshot } from '../game/levels/LevelSession'
import { getBubbleVisualThemeForLevel } from '../game/rendering/bubbleVisualTheme'
import { missionDisplay, starThresholdProgress } from './gameplayPresentation'

interface FoundationScreenProps {
  readonly levelId?: number
  readonly onHome?: () => void
  readonly onNextLevel?: (levelId: number) => void
  readonly progression?: ProgressionRepository
}

function GameplayHud({ snapshot, levelId, paused, onPause, displayScore, pulsingObjectiveIds, starPulse }: {
  readonly snapshot: LevelSessionSnapshot | null
  readonly levelId: number
  readonly paused: boolean
  readonly onPause: () => void
  readonly displayScore: number
  readonly pulsingObjectiveIds: readonly string[]
  readonly starPulse: boolean
}) {
  const thresholds = snapshot?.starThresholds
  const stars = thresholds === undefined ? [false, false, false] : starThresholdProgress(displayScore, thresholds)
  const objectives = snapshot?.mission.objectives ?? []
  const visualTheme = getBubbleVisualThemeForLevel(snapshot?.levelId ?? levelId)
  return (
    <>
      <header className="gameplay-hud">
        <button type="button" className="hud-icon-button" aria-label={paused ? 'Resume gameplay' : 'Pause gameplay'} onClick={onPause}><GameIcon name={paused ? 'play' : 'pause'} size={22} /></button>
        <div className="gameplay-stat gameplay-stat--level"><small>LEVEL</small><strong>{snapshot?.displayNumber ?? levelId}</strong></div>
        <div className="gameplay-stat gameplay-stat--score"><small>SCORE</small><strong>{displayScore.toLocaleString()}</strong></div>
        <div className="gameplay-stat gameplay-stat--shots"><small>SHOTS</small><strong>{snapshot?.shotsRemaining ?? '—'}</strong></div>
        <div className={`gameplay-star-track${starPulse ? ' is-pulsing' : ''}`} aria-label="Star progress">{stars.map((earned, index) => <span key={index} className={earned ? 'is-earned' : ''}>★</span>)}</div>
        <div className="gameplay-mission gameplay-mission--hub" aria-label="Mission progress">
          {objectives.map((objective) => {
            const display = missionDisplay(objective)
            const pulsing = pulsingObjectiveIds.includes(objective.objectiveId)
            return <div key={objective.objectiveId} className={`mission-chip ${display.completed ? 'is-complete' : ''}${pulsing ? ' is-pulsing' : ''}`}><span>{display.label}</span><strong>{display.progress}</strong></div>
          })}
        </div>
      </header>
      <div className="gameplay-bubble-hud">
        <div className="next-bubble-preview" data-bubble-theme={visualTheme}><small>NEXT</small><span className={`hud-bubble hud-bubble--${snapshot?.gameplay.nextBubble.color ?? 'yellow'}`} /></div>
      </div>
    </>
  )
}

export function FoundationScreen({ levelId = 1, onHome, onNextLevel, progression }: FoundationScreenProps) {
  const [sessionSnapshot, setSessionSnapshot] = useState<LevelSessionSnapshot | null>(null)
  const [pauseRequested, setPauseRequested] = useState(false)
  const [restartRequest, setRestartRequest] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [pulsingObjectiveIds, setPulsingObjectiveIds] = useState<readonly string[]>([])
  const [starPulse, setStarPulse] = useState(false)
  const [terminalReady, setTerminalReady] = useState(true)
  const previousSnapshotRef = useRef<LevelSessionSnapshot | null>(null)
  const displayScoreRef = useRef(0)
  const scoreAnimationFrameRef = useRef(0)
  const pulseTimeoutRef = useRef<number | null>(null)
  const starPulseTimeoutRef = useRef<number | null>(null)
  const terminalTimeoutRef = useRef<number | null>(null)
  const starHistoryRef = useRef<Set<number>>(new Set())

  const nextLevelId = levelId + 1
  const canNext = sessionSnapshot?.status === 'WON' && sessionSnapshot.highestUnlockedLevel >= nextLevelId && nextLevelId <= 10_000
  const status = sessionSnapshot?.status ?? 'ACTIVE'
  const visualTheme = getBubbleVisualThemeForLevel(sessionSnapshot?.levelId ?? levelId)

  const setDisplayedScore = useCallback((value: number) => {
    displayScoreRef.current = value
    setDisplayScore(value)
  }, [])

  const snapshotHandler = useCallback((next: LevelSessionSnapshot) => {
    const previous = previousSnapshotRef.current
    if (previous === null || previous.levelId !== next.levelId) {
      starHistoryRef.current.clear()
      setDisplayedScore(0)
      setTerminalReady(next.status === 'ACTIVE')
    } else {
      if (next.status === 'ACTIVE') {
        setTerminalReady(true)
      } else if (previous.status === 'ACTIVE') {
        setTerminalReady(false)
        if (terminalTimeoutRef.current !== null) window.clearTimeout(terminalTimeoutRef.current)
        terminalTimeoutRef.current = window.setTimeout(() => setTerminalReady(true), 240)
      }
      const changedObjectives = next.mission.changedObjectiveIds.filter((id) => {
        const before = previous.mission.objectives.find((objective) => objective.objectiveId === id)
        const after = next.mission.objectives.find((objective) => objective.objectiveId === id)
        return before !== undefined && after !== undefined && (before.progress !== after.progress || before.completed !== after.completed)
      })
      if (changedObjectives.length > 0) {
        setPulsingObjectiveIds(changedObjectives)
        if (pulseTimeoutRef.current !== null) window.clearTimeout(pulseTimeoutRef.current)
        pulseTimeoutRef.current = window.setTimeout(() => setPulsingObjectiveIds([]), 280)
      }
      const crossed = [next.starThresholds.one, next.starThresholds.two, next.starThresholds.three].filter((threshold) => previous.currentRunScore < threshold && next.currentRunScore >= threshold && !starHistoryRef.current.has(threshold))
      if (crossed.length > 0) {
        crossed.forEach((threshold) => starHistoryRef.current.add(threshold))
        setStarPulse(true)
        if (starPulseTimeoutRef.current !== null) window.clearTimeout(starPulseTimeoutRef.current)
        starPulseTimeoutRef.current = window.setTimeout(() => setStarPulse(false), 420)
      }
    }
    previousSnapshotRef.current = next
    setSessionSnapshot(next)
  }, [setDisplayedScore])

  const targetScore = sessionSnapshot?.currentRunScore ?? 0
  useEffect(() => {
    window.cancelAnimationFrame(scoreAnimationFrameRef.current)
    if (pauseRequested || displayScoreRef.current === targetScore) {
      return
    }
    const startValue = displayScoreRef.current
    const startedAt = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 320)
      const eased = 1 - (1 - progress) ** 3
      setDisplayedScore(Math.round(startValue + (targetScore - startValue) * eased))
      if (progress < 1) scoreAnimationFrameRef.current = window.requestAnimationFrame(tick)
    }
    scoreAnimationFrameRef.current = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(scoreAnimationFrameRef.current)
  }, [pauseRequested, setDisplayedScore, targetScore])

  useEffect(() => () => {
    window.cancelAnimationFrame(scoreAnimationFrameRef.current)
    if (pulseTimeoutRef.current !== null) window.clearTimeout(pulseTimeoutRef.current)
    if (starPulseTimeoutRef.current !== null) window.clearTimeout(starPulseTimeoutRef.current)
    if (terminalTimeoutRef.current !== null) window.clearTimeout(terminalTimeoutRef.current)
  }, [])

  const restart = () => { setPauseRequested(false); setDisplayedScore(0); previousSnapshotRef.current = null; setRestartRequest((value) => value + 1) }
  const pauseToggle = () => setPauseRequested((value) => !value)

  return (
    <section className={`gameplay-screen gameplay-theme--${visualTheme}`} aria-label="Bubble Shooter gameplay">
      <div className="gameplay-world">
        <CanvasHost initialLevelId={levelId} {...(progression ? { progression } : {})} onSessionSnapshot={snapshotHandler} pauseRequested={pauseRequested} restartRequest={restartRequest} onPauseStateChange={setPauseRequested} />
        <GameplayHud snapshot={sessionSnapshot} levelId={levelId} paused={pauseRequested} onPause={pauseToggle} displayScore={displayScore} pulsingObjectiveIds={pulsingObjectiveIds} starPulse={starPulse} />
        {pauseRequested ? <div className="gameplay-overlay" role="dialog" aria-label="Paused"><div className="overlay-panel"><span className="overlay-kicker">PAUSED</span><h1>Take a breath</h1><button type="button" className="overlay-primary" onClick={() => setPauseRequested(false)}>Resume</button><button type="button" className="overlay-secondary" onClick={restart}>Restart Level</button><button type="button" className="overlay-secondary" onClick={onHome}>Home</button></div></div> : null}
        {status === 'WON' && terminalReady ? <div className="gameplay-overlay" role="dialog" aria-label="Level complete"><div className="overlay-panel"><span className="overlay-kicker">LEVEL COMPLETE</span><h1>Brilliant pop!</h1><p>{sessionSnapshot?.finalScore?.toLocaleString() ?? 0} points · {sessionSnapshot?.earnedStars ?? 0} stars</p><button type="button" className="overlay-primary" onClick={restart}>Replay</button>{canNext && onNextLevel ? <button type="button" className="overlay-primary" onClick={() => onNextLevel(nextLevelId)}>Next Level</button> : null}<button type="button" className="overlay-secondary" onClick={onHome}>Home</button></div></div> : null}
        {status === 'LOST' && terminalReady ? <div className="gameplay-overlay" role="dialog" aria-label="Out of shots"><div className="overlay-panel"><span className="overlay-kicker">OUT OF SHOTS</span><h1>Almost there</h1><p>Try a new angle and clear the board.</p><button type="button" className="overlay-primary" onClick={restart}>Retry</button><button type="button" className="overlay-secondary" onClick={onHome}>Home</button></div></div> : null}
      </div>
    </section>
  )
}
