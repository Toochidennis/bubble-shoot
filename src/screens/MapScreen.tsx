import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { GameIcon } from '../components/GameIcon'
import type { ProgressionRepository } from '../game/progression/ProgressionRepository'
import { MAX_SUPPORTED_LEVEL_ID } from '../game/progression/types'
import { DEFAULT_MAP_LAYOUT, getMapContentHeight, getMapFocusScrollTop, getMapNodeLayout, getVisibleLevelRange } from '../game/map/mapLayout'
import { getMapLevelState, getQuickPlayLevel } from '../game/map/progressionView'
import { gameAudio } from '../game/audio/gameAudio'
import { HOME_AMBIENT_ELEMENTS } from './homeAmbient'

interface MapScreenProps {
  readonly progression: ProgressionRepository
  readonly onHome: () => void
  readonly onProfile: () => void
  readonly onLaunchLevel: (levelId: number) => void
}

function starsFor(levelId: number, progression: ProgressionRepository): number {
  return progression.getRecord(levelId)?.bestStars ?? 0
}

export function MapScreen({ progression, onHome, onProfile, onLaunchLevel }: MapScreenProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const focusedRef = useRef(false)
  const [selectedLevel, setSelectedLevel] = useState(() => progression.highestUnlockedLevel)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(640)
  const highestUnlocked = progression.highestUnlockedLevel
  const range = getVisibleLevelRange(scrollTop, viewportHeight, DEFAULT_MAP_LAYOUT, 5)
  const levels = useMemo(() => Array.from({ length: Math.max(0, range.end - range.start + 1) }, (_, index) => range.start + index), [range.end, range.start])

  useEffect(() => {
    const viewport = mapRef.current
    if (viewport === null) return undefined
    const resize = () => setViewportHeight(viewport.clientHeight)
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const viewport = mapRef.current
    if (viewport === null || focusedRef.current) return
    focusedRef.current = true
    viewport.scrollTop = getMapFocusScrollTop(highestUnlocked, viewport.clientHeight, DEFAULT_MAP_LAYOUT)
    setScrollTop(viewport.scrollTop)
  }, [highestUnlocked])

  const selectedState = getMapLevelState(selectedLevel, highestUnlocked, progression.getRecord(selectedLevel))
  const selectedStars = starsFor(selectedLevel, progression)
  const pathTop = Math.max(0, getMapNodeLayout(range.start).y + 70)
  const pathBottom = getMapNodeLayout(range.end).y + 270
  const pathHeight = Math.max(240, pathBottom - pathTop)
  const quickPlayLevel = getQuickPlayLevel(highestUnlocked, MAX_SUPPORTED_LEVEL_ID)
  const playUi = () => { gameAudio.unlock(); gameAudio.playMusic('home'); gameAudio.play('uiClick') }
  const launchSelected = () => {
    if (selectedState !== 'locked') { playUi(); onLaunchLevel(selectedLevel) }
  }

  return (
    <main className="map-screen" aria-label="Bubble Shooter level map">
      <div className="dashboard-ambient" aria-hidden="true">
        <span className="ambient-glow ambient-glow--one" />
        <span className="ambient-glow ambient-glow--two" />
        {HOME_AMBIENT_ELEMENTS.map((bubble) => <span key={`${bubble.left}-${bubble.top}`} className={`ambient-bubble ambient-bubble--${bubble.color} ambient-bubble--${bubble.depth}`} style={{ left: bubble.left, top: bubble.top, width: bubble.size, height: bubble.size, '--ambient-duration': bubble.duration, '--ambient-delay': bubble.delay, '--ambient-drift-x': bubble.driftX, '--ambient-drift-y': bubble.driftY, '--ambient-rotate': bubble.driftRotate, '--ambient-scale': bubble.driftScale, '--ambient-loop-in-x': bubble.loopInX, '--ambient-loop-in-y': bubble.loopInY, '--ambient-loop-out-x': bubble.loopOutX, '--ambient-loop-out-y': bubble.loopOutY } as CSSProperties} />)}
      </div>

      <header className="map-screen-header">
        <button type="button" className="map-screen-back" aria-label="Back to Home" onClick={() => { playUi(); onHome() }}><GameIcon name="home" size={18} /></button>
        <div className="map-screen-title"><span>LEVEL JOURNEY</span><strong>Map</strong></div>
        <button type="button" className="map-screen-profile" aria-label="Open your profile" onClick={() => { playUi(); onProfile() }}><GameIcon name="user" size={19} /></button>
      </header>

      <section className="map-screen-summary" aria-label={`Selected level ${selectedLevel}`}>
        <div><small>SELECTED LEVEL</small><strong>Level {selectedLevel.toLocaleString()}</strong><span>{selectedState === 'completed' ? `${selectedStars}/3 stars earned` : selectedState === 'locked' ? 'Locked' : 'Ready to play'}</span></div>
        <button type="button" className="map-screen-play" disabled={selectedState === 'locked'} onClick={launchSelected}>{selectedState === 'completed' ? 'REPLAY' : 'PLAY'} <GameIcon name="play" size={14} /></button>
      </section>

      <div ref={mapRef} className="map-viewport map-screen-viewport" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)} aria-label="Scrollable level map" role="region" tabIndex={0}>
        <div className="map-world" style={{ height: getMapContentHeight() + 210 }}>
          <svg className="map-path-layer" aria-hidden="true" style={{ top: pathTop, height: pathHeight }} viewBox={`0 0 1000 ${pathHeight}`} preserveAspectRatio="none">
            {levels.slice(0, -1).map((levelId) => {
              const first = getMapNodeLayout(levelId)
              const second = getMapNodeLayout(levelId + 1)
              const x1 = 500 + first.x * 700
              const x2 = 500 + second.x * 700
              const y1 = first.y + 170 - pathTop
              const y2 = second.y + 170 - pathTop
              return <path key={levelId} d={`M ${x1} ${y1} C ${x1 + 150} ${y1 + 45}, ${x2 - 150} ${y2 - 45}, ${x2} ${y2}`} />
            })}
          </svg>
          {levels.map((levelId) => {
            const layout = getMapNodeLayout(levelId)
            const state = getMapLevelState(levelId, highestUnlocked, progression.getRecord(levelId))
            const stars = starsFor(levelId, progression)
            return <button key={levelId} type="button" className={`level-node level-node--${state} ${selectedLevel === levelId ? 'is-selected' : ''}`} style={{ top: layout.y + 170, left: `calc(50% + ${layout.x * 36}%)` }} onClick={() => { if (state !== 'locked') { playUi(); setSelectedLevel(levelId) } }} disabled={state === 'locked'} aria-label={`Level ${levelId}, ${state}${stars > 0 ? `, ${stars} stars` : ''}`}>
              <span className="node-number">{levelId}</span>
              {state === 'locked' ? <span className="node-lock">⌑</span> : <span className="node-stars">{[1, 2, 3].map((star) => <i key={star} className={star <= stars ? 'is-earned' : ''}>★</i>)}</span>}
            </button>
          })}
        </div>
      </div>

      <nav className="dashboard-nav map-screen-nav" aria-label="Main navigation">
        <button className="nav-item" type="button" onClick={() => { playUi(); onHome() }}><GameIcon name="home" /><small>HOME</small></button>
        <button className="nav-item is-active" type="button" aria-current="page"><GameIcon name="map" /><small>MAP</small></button>
        <button className="nav-item" type="button" onClick={() => { playUi(); onProfile() }}><GameIcon name="user" /><small>PROFILE</small></button>
        <button className="map-quick-play" type="button" onClick={() => { playUi(); onLaunchLevel(quickPlayLevel) }} aria-label={`Continue at level ${quickPlayLevel}`}><GameIcon name="play" size={18} /><small>CONTINUE</small></button>
      </nav>
    </main>
  )
}
