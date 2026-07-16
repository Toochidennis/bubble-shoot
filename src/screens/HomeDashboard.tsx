import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import type { ProgressionRepository } from '../game/progression/ProgressionRepository'
import { MAX_SUPPORTED_LEVEL_ID } from '../game/progression/types'
import { DEFAULT_MAP_LAYOUT, getMapContentHeight, getMapFocusScrollTop, getMapNodeLayout, getVisibleLevelRange } from '../game/map/mapLayout'
import { getMapLevelState, getQuickPlayLevel } from '../game/map/progressionView'
import { GameIcon } from '../components/GameIcon'
import { HOME_AMBIENT_ELEMENTS } from './homeAmbient'
import { gameAudio } from '../game/audio/gameAudio'
import type { BubbleShooterCountryOption } from '../game/catalog/bubbleShooterCatalogTypes'
import { bubbleShooterFlagDisplay } from '../game/catalog/bubbleShooterCatalogFormatting'
import type { BubbleShooterProfile } from '../game/profile/bubbleShooterProfile'

interface HomeDashboardProps {
  readonly profile: BubbleShooterProfile
  readonly countries: readonly BubbleShooterCountryOption[]
  readonly progression: ProgressionRepository
  readonly onLaunchLevel: (levelId: number) => void
  readonly onSettings: () => void
  readonly onProfile: () => void
}

function starsFor(levelId: number, progression: ProgressionRepository): number {
  return progression.getRecord(levelId)?.bestStars ?? 0
}

export function HomeDashboard({ profile, countries, progression, onLaunchLevel, onSettings, onProfile }: HomeDashboardProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const focusedRef = useRef(false)
  const [selectedLevel, setSelectedLevel] = useState(() => progression.highestUnlockedLevel)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(640)
  const highestUnlocked = progression.highestUnlockedLevel
  const snapshot = progression.snapshot()
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

  useEffect(() => {
    gameAudio.playMusic('home')
  }, [])

  const selectedState = getMapLevelState(selectedLevel, highestUnlocked, progression.getRecord(selectedLevel))
  const selectedStars = starsFor(selectedLevel, progression)
  const pathTop = Math.max(0, getMapNodeLayout(range.start).y + 70)
  const pathBottom = getMapNodeLayout(range.end).y + 270
  const pathHeight = Math.max(240, pathBottom - pathTop)
  const playUi = () => { gameAudio.unlock(); gameAudio.playMusic('home'); gameAudio.play('uiClick') }
  const launchSelected = () => {
    if (selectedState !== 'locked') { playUi(); onLaunchLevel(selectedLevel) }
  }
  const quickPlayLevel = getQuickPlayLevel(highestUnlocked, MAX_SUPPORTED_LEVEL_ID)
  const profileCountry = countries.find((country) => country.code === profile.countryCode)

  return (
    <main className="home-dashboard" aria-label="Bubble Shooter Home Dashboard">
      <div className="dashboard-ambient" aria-hidden="true">
        <span className="ambient-glow ambient-glow--one" />
        <span className="ambient-glow ambient-glow--two" />
        {HOME_AMBIENT_ELEMENTS.map((bubble) => <span key={`${bubble.left}-${bubble.top}`} className={`ambient-bubble ambient-bubble--${bubble.color} ambient-bubble--${bubble.depth}`} style={{ left: bubble.left, top: bubble.top, width: bubble.size, height: bubble.size, '--ambient-duration': bubble.duration, '--ambient-delay': bubble.delay, '--ambient-drift-x': bubble.driftX, '--ambient-drift-y': bubble.driftY, '--ambient-rotate': bubble.driftRotate, '--ambient-scale': bubble.driftScale, '--ambient-loop-in-x': bubble.loopInX, '--ambient-loop-in-y': bubble.loopInY, '--ambient-loop-out-x': bubble.loopOutX, '--ambient-loop-out-y': bubble.loopOutY } as CSSProperties} />)}
      </div>

      <header className="dashboard-hud">
        <button className="dashboard-profile" type="button" aria-label="Open your profile" onClick={() => { playUi(); onProfile() }}>
          <img className="dashboard-profile-avatar" src={`/avatars/${profile.avatarId}.png`} alt="" />
          <span className="dashboard-profile-copy">
            <strong>{profile.displayName || 'Player'}</strong>
            <span className="dashboard-profile-flag" aria-label={profileCountry ? profileCountry.name : 'Country not selected'}>{profileCountry ? bubbleShooterFlagDisplay(profileCountry.emoji ?? profileCountry.code) : '🌐'}</span>
          </span>
        </button>
        <div className="dashboard-brand" aria-label="Bubble Shooter">
          <span className="brand-orb">✦</span>
          <span><strong>BUBBLE</strong><em>SHOOTER</em></span>
        </div>
        <button className="hud-settings" type="button" aria-label="Open settings" onClick={() => { playUi(); onSettings() }}><GameIcon name="settings" size={23} /></button>
      </header>

      <section className="dashboard-hero" aria-label="Selected level">
        <div className="hero-copy">
          <span className="hero-kicker">YOUR JOURNEY</span>
          <h1>Level {selectedLevel.toLocaleString()}</h1>
          <p>{selectedState === 'completed' ? 'Replay and beat your best.' : selectedState === 'locked' ? 'Keep popping to unlock this level.' : 'Your next bubble adventure awaits.'}</p>
        </div>
        <button className="hero-play" type="button" onClick={launchSelected} disabled={selectedState === 'locked'}>
          <span>{selectedState === 'completed' ? 'REPLAY' : 'PLAY'}</span>
          <span className="hero-play-arrow"><GameIcon name="play" size={16} /></span>
        </button>
        <div className="hero-stars" aria-label={`${selectedStars} saved stars`}>
          {[1, 2, 3].map((star) => <span key={star} className={star <= selectedStars ? 'is-earned' : ''}>★</span>)}
        </div>
      </section>

      <div ref={mapRef} className="map-viewport" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)} aria-label="Scrollable level map" role="region" tabIndex={0}>
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
            return (
              <button
                key={levelId}
                type="button"
                className={`level-node level-node--${state} ${selectedLevel === levelId ? 'is-selected' : ''}`}
                style={{ top: layout.y + 170, left: `calc(50% + ${layout.x * 36}%)` }}
                onClick={() => { if (state !== 'locked') { playUi(); setSelectedLevel(levelId) } }}
                disabled={state === 'locked'}
                aria-label={`Level ${levelId}, ${state}${stars > 0 ? `, ${stars} stars` : ''}`}
              >
                <span className="node-number">{levelId}</span>
                {state === 'locked' ? <span className="node-lock">⌑</span> : <span className="node-stars">{[1, 2, 3].map((star) => <i key={star} className={star <= stars ? 'is-earned' : ''}>★</i>)}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <nav className="dashboard-nav" aria-label="Main navigation">
        <button className="nav-item is-active" type="button" onClick={() => mapRef.current?.scrollTo({ top: getMapFocusScrollTop(highestUnlocked, viewportHeight), behavior: 'smooth' })}><GameIcon name="home" /><small>HOME</small></button>
        <button className="nav-item" type="button" onClick={() => { playUi(); onProfile() }}><GameIcon name="user" /><small>PROFILE</small></button>
        <button className="quick-play" type="button" onClick={() => { playUi(); onLaunchLevel(quickPlayLevel) }} aria-label={`Continue at level ${quickPlayLevel}`}><span className="quick-play-ring"><GameIcon name="play" size={28} /></span><small>PLAY</small></button>
        <button className="nav-item nav-item--disabled" type="button" disabled aria-disabled="true"><GameIcon name="ranking" /><small>RANKING</small></button>
        <button className="nav-item nav-item--disabled" type="button" disabled aria-disabled="true"><GameIcon name="rewards" /><small>REWARDS</small></button>
      </nav>

      {snapshot.lastWriteFailed ? <div className="dashboard-status" aria-live="polite">Progress saved locally when available</div> : null}
    </main>
  )
}
