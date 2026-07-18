import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

import { CanvasHost } from '../components/CanvasHost'
import { GameIcon } from '../components/GameIcon'
import type { MissionObjectiveProgress } from '../game/mission/types'
import type { ProgressionRepository } from '../game/progression/ProgressionRepository'
import type { LevelSessionSnapshot } from '../game/levels/LevelSession'
import { getBubbleVisualThemeForLevel } from '../game/rendering/bubbleVisualTheme'
import { gameAudio } from '../game/audio/gameAudio'
import { missionDisplay } from './gameplayPresentation'

interface FoundationScreenProps {
  readonly levelId?: number
  readonly onHome?: () => void
  readonly onNextLevel?: (levelId: number) => void
  readonly progression?: ProgressionRepository
}

function missionIcon(type: MissionObjectiveProgress['type']): 'target' | 'drop' | 'clear' | 'score' {
  if (type === 'DROP_BUBBLES') return 'drop'
  if (type === 'CLEAR_ALL_BUBBLES') return 'clear'
  if (type === 'REACH_SCORE') return 'score'
  return 'target'
}

function MissionAllBubble() {
  return (
    <svg className="mission-all-bubble" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="15" cy="14" r="8" fill="#d93654" stroke="#ff98a8" strokeWidth="1.2" />
      <circle cx="33" cy="14" r="8" fill="#34b844" stroke="#a9ff86" strokeWidth="1.2" />
      <circle cx="14" cy="34" r="8" fill="#9b4cff" stroke="#e0b5ff" strokeWidth="1.2" />
      <circle cx="34" cy="34" r="8" fill="#e3a624" stroke="#ffe28a" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="12" fill="#237ddd" stroke="#9fddff" strokeWidth="1.4" />
      <circle cx="20" cy="19" r="3.5" fill="#fff" opacity=".72" />
      <circle cx="11.8" cy="11.1" r="1.7" fill="#fff" opacity=".66" />
      <circle cx="29.8" cy="11.1" r="1.7" fill="#fff" opacity=".58" />
      <circle cx="11" cy="31" r="1.6" fill="#fff" opacity=".52" />
      <circle cx="31" cy="31" r="1.6" fill="#fff" opacity=".52" />
    </svg>
  )
}

function MissionObjectiveCard({ objective, pulsing }: { readonly objective: MissionObjectiveProgress; readonly pulsing: boolean }) {
  const display = missionDisplay(objective)
  const completionPercent = Math.min(100, Math.max(0, (objective.progress / Math.max(1, objective.target)) * 100))
  return (
    <div
      className={`mission-card${display.completed ? ' is-complete' : ''}${pulsing ? ' is-pulsing' : ''}`}
      role="img"
      aria-label={`${display.label}: ${display.progress} remaining`}
      title={`${display.label}: ${display.progress} remaining`}
    >
      <div className={`mission-target-bubble mission-target-bubble--${display.bubbleColor}${objective.type === 'CLEAR_ALL_BUBBLES' ? ' mission-target-bubble--all' : ''}`}>
        <span className="mission-progress-ring" style={{ '--mission-progress': `${completionPercent}%` } as CSSProperties} />
        {objective.type === 'CLEAR_ALL_BUBBLES' ? <MissionAllBubble /> : <span className={`hud-bubble hud-bubble--${display.bubbleColor}`} />}
        {objective.type === 'CLEAR_MARKED' ? <span className="mission-target-ring" /> : null}
        <span className="mission-target-icon"><GameIcon name={missionIcon(objective.type)} size={14} /></span>
      </div>
      <strong className="mission-progress-count" aria-hidden="true">{display.progress}</strong>
    </div>
  )
}

function GameplayHud({ snapshot, levelId, paused, onPause, pulsingObjectiveIds }: {
  readonly snapshot: LevelSessionSnapshot | null
  readonly levelId: number
  readonly paused: boolean
  readonly onPause: () => void
  readonly pulsingObjectiveIds: readonly string[]
}) {
  const objectives = snapshot?.mission.objectives ?? []
  const visualTheme = getBubbleVisualThemeForLevel(snapshot?.levelId ?? levelId)
  return (
    <>
      <header className="gameplay-hud">
        <button type="button" className="hud-icon-button" aria-label={paused ? 'Resume gameplay' : 'Pause gameplay'} onClick={() => { gameAudio.unlock(); gameAudio.play('uiClick'); onPause() }}><GameIcon name={paused ? 'play' : 'pause'} size={22} /></button>
        <div className="gameplay-stat gameplay-stat--shots"><small>SHOTS</small><strong>{snapshot?.shotsRemaining ?? '—'}</strong></div>
        <div className="gameplay-mission gameplay-mission--hub" aria-label="Mission progress">
          {objectives.map((objective) => <MissionObjectiveCard key={objective.objectiveId} objective={objective} pulsing={pulsingObjectiveIds.includes(objective.objectiveId)} />)}
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
  const [pulsingObjectiveIds, setPulsingObjectiveIds] = useState<readonly string[]>([])
  const [revealedStars, setRevealedStars] = useState(0)
  const [terminalReady, setTerminalReady] = useState(true)
  const previousSnapshotRef = useRef<LevelSessionSnapshot | null>(null)
  const pulseTimeoutRef = useRef<number | null>(null)
  const terminalTimeoutRef = useRef<number | null>(null)

  const nextLevelId = levelId + 1
  const canNext = sessionSnapshot?.status === 'WON' && sessionSnapshot.highestUnlockedLevel >= nextLevelId && nextLevelId <= 10_000
  const status = sessionSnapshot?.status ?? 'ACTIVE'
  const visualTheme = getBubbleVisualThemeForLevel(sessionSnapshot?.levelId ?? levelId)

  useEffect(() => {
    gameAudio.playMusic('gameplay')
  }, [])

  const snapshotHandler = useCallback((next: LevelSessionSnapshot) => {
    const previous = previousSnapshotRef.current
    if (previous === null || previous.levelId !== next.levelId) {
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
    }
    previousSnapshotRef.current = next
    setSessionSnapshot(next)
  }, [])

  useEffect(() => () => {
    if (pulseTimeoutRef.current !== null) window.clearTimeout(pulseTimeoutRef.current)
    if (terminalTimeoutRef.current !== null) window.clearTimeout(terminalTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (sessionSnapshot?.status !== 'WON' || !terminalReady) {
      return undefined
    }
    const earnedStars = sessionSnapshot.earnedStars ?? 0
    let revealed = 0
    const timer = window.setInterval(() => {
      revealed += 1
      setRevealedStars(Math.min(revealed, earnedStars))
      if (revealed >= earnedStars) window.clearInterval(timer)
    }, 260)
    return () => window.clearInterval(timer)
  }, [sessionSnapshot?.earnedStars, sessionSnapshot?.status, terminalReady])

  const restart = () => { setPauseRequested(false); setRevealedStars(0); previousSnapshotRef.current = null; setRestartRequest((value) => value + 1) }
  const pauseToggle = () => setPauseRequested((value) => !value)

  return (
    <section className={`gameplay-screen gameplay-theme--${visualTheme}`} aria-label="Bubble Shooter gameplay">
      <div className="gameplay-world">
        <CanvasHost initialLevelId={levelId} {...(progression ? { progression } : {})} onSessionSnapshot={snapshotHandler} pauseRequested={pauseRequested} restartRequest={restartRequest} onPauseStateChange={setPauseRequested} />
        <GameplayHud snapshot={sessionSnapshot} levelId={levelId} paused={pauseRequested} onPause={pauseToggle} pulsingObjectiveIds={pulsingObjectiveIds} />
        {pauseRequested ? <div className="gameplay-overlay" role="dialog" aria-label="Paused"><div className="overlay-panel"><span className="overlay-kicker">PAUSED</span><h1>Take a breath</h1><button type="button" className="overlay-primary" onClick={() => setPauseRequested(false)}>Resume</button><button type="button" className="overlay-secondary" onClick={restart}>Restart Level</button><button type="button" className="overlay-secondary" onClick={onHome}>Home</button></div></div> : null}
        {status === 'WON' && terminalReady ? <div className="gameplay-overlay" role="dialog" aria-label="Level complete"><div className="overlay-panel"><span className="overlay-kicker">LEVEL COMPLETE</span><span className="overlay-level">Level {sessionSnapshot?.displayNumber ?? levelId}</span><h1>Brilliant pop!</h1><div className="overlay-result-score">{sessionSnapshot?.finalScore?.toLocaleString() ?? 0}<small>POINTS</small></div><div className="overlay-stars" aria-label={`${sessionSnapshot?.earnedStars ?? 0} stars earned`}>{[1, 2, 3].map((star) => <span key={star} className={star <= revealedStars ? 'is-revealed' : ''}>★</span>)}</div>{canNext && onNextLevel ? <button type="button" className="overlay-primary" onClick={() => onNextLevel(nextLevelId)}>Next Level</button> : null}<button type="button" className="overlay-secondary" onClick={onHome}>Home</button></div></div> : null}
        {status === 'LOST' && terminalReady ? <div className="gameplay-overlay" role="dialog" aria-label="Out of shots"><div className="overlay-panel"><span className="overlay-kicker">OUT OF SHOTS</span><h1>Almost there</h1><p>Try a new angle and clear the board.</p><button type="button" className="overlay-primary" onClick={restart}>Retry</button><button type="button" className="overlay-secondary" onClick={onHome}>Home</button></div></div> : null}
      </div>
    </section>
  )
}
