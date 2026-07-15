import { useCallback, useState } from 'react'

import { CanvasHost } from '../components/CanvasHost'
import { GameIcon } from '../components/GameIcon'
import type { ProgressionRepository } from '../game/progression/ProgressionRepository'
import type { LevelSessionSnapshot } from '../game/levels/LevelSession'
import { missionDisplay, starThresholdProgress } from './gameplayPresentation'
import { getBubbleVisualThemeForLevel } from '../game/rendering/bubbleVisualTheme'

interface FoundationScreenProps {
  readonly levelId?: number
  readonly onHome?: () => void
  readonly onNextLevel?: (levelId: number) => void
  readonly progression?: ProgressionRepository
}

function GameplayHud({ snapshot, levelId, paused, onPause }: { readonly snapshot: LevelSessionSnapshot | null; readonly levelId: number; readonly paused: boolean; readonly onPause: () => void }) {
  const score = snapshot?.currentRunScore ?? 0
  const thresholds = snapshot?.starThresholds
  const stars = thresholds === undefined ? [false, false, false] : starThresholdProgress(score, thresholds)
  const objectives = snapshot?.mission.objectives ?? []
  const visualTheme = getBubbleVisualThemeForLevel(snapshot?.levelId ?? levelId)
  return (
    <>
      <header className="gameplay-hud">
        <button type="button" className="hud-icon-button" aria-label={paused ? 'Resume gameplay' : 'Pause gameplay'} onClick={onPause}><GameIcon name={paused ? 'play' : 'pause'} size={22} /></button>
        <div className="gameplay-stat gameplay-stat--level"><small>LEVEL</small><strong>{snapshot?.displayNumber ?? levelId}</strong></div>
        <div className="gameplay-stat gameplay-stat--score"><small>SCORE</small><strong>{score.toLocaleString()}</strong></div>
        <div className="gameplay-stat gameplay-stat--shots"><small>SHOTS</small><strong>{snapshot?.shotsRemaining ?? '—'}</strong></div>
        <div className="gameplay-star-track" aria-label="Star progress">{stars.map((earned, index) => <span key={index} className={earned ? 'is-earned' : ''}>★</span>)}</div>
        <div className="gameplay-mission gameplay-mission--hub" aria-label="Mission progress">
          {objectives.map((objective) => { const display = missionDisplay(objective); return <div key={objective.objectiveId} className={`mission-chip ${display.completed ? 'is-complete' : ''}`}><span>{display.label}</span><strong>{display.progress}</strong></div> })}
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
  const snapshotHandler = useCallback((next: LevelSessionSnapshot) => setSessionSnapshot(next), [])
  const nextLevelId = levelId + 1
  const canNext = sessionSnapshot?.status === 'WON' && sessionSnapshot.highestUnlockedLevel >= nextLevelId && nextLevelId <= 10_000
  const status = sessionSnapshot?.status ?? 'ACTIVE'
  const visualTheme = getBubbleVisualThemeForLevel(sessionSnapshot?.levelId ?? levelId)

  const restart = () => { setPauseRequested(false); setRestartRequest((value) => value + 1) }
  const pauseToggle = () => setPauseRequested((value) => !value)

  return (
    <section className={`gameplay-screen gameplay-theme--${visualTheme}`} aria-label="Bubble Shooter gameplay">
      <div className="gameplay-world">
        <CanvasHost initialLevelId={levelId} {...(progression ? { progression } : {})} onSessionSnapshot={snapshotHandler} pauseRequested={pauseRequested} restartRequest={restartRequest} onPauseStateChange={setPauseRequested} />
        <GameplayHud snapshot={sessionSnapshot} levelId={levelId} paused={pauseRequested} onPause={pauseToggle} />
        {pauseRequested ? <div className="gameplay-overlay" role="dialog" aria-label="Paused"><div className="overlay-panel"><span className="overlay-kicker">PAUSED</span><h1>Take a breath</h1><button type="button" className="overlay-primary" onClick={() => setPauseRequested(false)}>Resume</button><button type="button" className="overlay-secondary" onClick={restart}>Restart Level</button><button type="button" className="overlay-secondary" onClick={onHome}>Home</button></div></div> : null}
        {status === 'WON' ? <div className="gameplay-overlay" role="dialog" aria-label="Level complete"><div className="overlay-panel"><span className="overlay-kicker">LEVEL COMPLETE</span><h1>Brilliant pop!</h1><p>{sessionSnapshot?.finalScore?.toLocaleString() ?? 0} points · {sessionSnapshot?.earnedStars ?? 0} stars</p><button type="button" className="overlay-primary" onClick={restart}>Replay</button>{canNext && onNextLevel ? <button type="button" className="overlay-primary" onClick={() => onNextLevel(nextLevelId)}>Next Level</button> : null}<button type="button" className="overlay-secondary" onClick={onHome}>Home</button></div></div> : null}
        {status === 'LOST' ? <div className="gameplay-overlay" role="dialog" aria-label="Out of shots"><div className="overlay-panel"><span className="overlay-kicker">OUT OF SHOTS</span><h1>Almost there</h1><p>Try a new angle and clear the board.</p><button type="button" className="overlay-primary" onClick={restart}>Retry</button><button type="button" className="overlay-secondary" onClick={onHome}>Home</button></div></div> : null}
      </div>
    </section>
  )
}
