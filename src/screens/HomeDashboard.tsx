import { useEffect, type CSSProperties } from 'react'

import { GameIcon } from '../components/GameIcon'
import { getLevel } from '../game/levels/levelCatalog'
import type { NormalizedLevelDefinition } from '../game/levels/types'
import type { MissionConfiguration } from '../game/mission/types'
import type { ProgressionRepository } from '../game/progression/ProgressionRepository'
import { MAX_SUPPORTED_LEVEL_ID } from '../game/progression/types'
import { getMapLevelState, getQuickPlayLevel } from '../game/map/progressionView'
import { gameAudio } from '../game/audio/gameAudio'
import type { BubbleColor } from '../game/shooter/types'
import type { BubbleShooterCountryOption } from '../game/catalog/bubbleShooterCatalogTypes'
import { bubbleShooterFlagDisplay } from '../game/catalog/bubbleShooterCatalogFormatting'
import type { BubbleShooterProfile } from '../game/profile/bubbleShooterProfile'
import { HOME_AMBIENT_ELEMENTS } from './homeAmbient'

interface HomeDashboardProps {
  readonly profile: BubbleShooterProfile
  readonly countries: readonly BubbleShooterCountryOption[]
  readonly progression: ProgressionRepository
  readonly onLaunchLevel: (levelId: number) => void
  readonly onSettings: () => void
  readonly onProfile: () => void
  readonly onMap: () => void
}

interface MissionBrief {
  readonly label: string
  readonly target: number
  readonly description: string
  readonly color: BubbleColor
  readonly allColors: boolean
}

function starsFor(levelId: number, progression: ProgressionRepository): number {
  return progression.getRecord(levelId)?.bestStars ?? 0
}

function missionBrief(level: NormalizedLevelDefinition | null): MissionBrief {
  const fallback: MissionBrief = { label: 'CLEAR ALL', target: level?.startingBubbles.length ?? 0, description: 'Clear every bubble on the board.', color: 'blue', allColors: true }
  if (level === null) return fallback
  const mission: MissionConfiguration = level.mission.type === 'MISSION_SET' ? level.mission.objectives[0] ?? { type: 'CLEAR_ALL_BUBBLES' } : level.mission
  switch (mission.type) {
    case 'POP_COLOR': return { label: `POP ${mission.targetColor.toUpperCase()}`, target: mission.targetCount, description: `Match ${mission.targetColor} bubbles.`, color: mission.targetColor, allColors: false }
    case 'DROP_BUBBLES': return { label: 'DROP BUBBLES', target: mission.targetCount, description: 'Drop the hanging bubbles.', color: 'green', allColors: false }
    case 'CLEAR_MARKED': return { label: 'CLEAR TARGETS', target: mission.targetCount, description: 'Clear the marked bubbles.', color: 'purple', allColors: false }
    case 'REACH_SCORE': return { label: 'REACH SCORE', target: mission.targetScore, description: 'Reach the target score.', color: 'yellow', allColors: false }
    case 'CLEAR_ALL_BUBBLES': return { label: 'CLEAR ALL', target: level.startingBubbles.length, description: 'Clear every bubble on the board.', color: 'blue', allColors: true }
  }
}

function HomeMissionCluster() {
  return <span className="home-mission-cluster" aria-hidden="true"><i className="home-mission-bubble home-mission-bubble--red" /><i className="home-mission-bubble home-mission-bubble--green" /><i className="home-mission-bubble home-mission-bubble--blue" /><i className="home-mission-bubble home-mission-bubble--purple" /><i className="home-mission-bubble home-mission-bubble--gold" /></span>
}

function HomeMissionVisual({ mission }: { readonly mission: MissionBrief }) {
  return mission.allColors ? <HomeMissionCluster /> : <span className={`home-mission-single home-mission-single--${mission.color}`} aria-hidden="true" />
}

export function HomeDashboard({ profile, countries, progression, onLaunchLevel, onSettings, onProfile, onMap }: HomeDashboardProps) {
  const highestUnlocked = progression.highestUnlockedLevel
  const quickPlayLevel = getQuickPlayLevel(highestUnlocked, MAX_SUPPORTED_LEVEL_ID)
  const quickLevelResult = getLevel(quickPlayLevel)
  const quickLevel = quickLevelResult.ok ? quickLevelResult.level : null
  const quickState = getMapLevelState(quickPlayLevel, highestUnlocked, progression.getRecord(quickPlayLevel))
  const selectedStars = starsFor(quickPlayLevel, progression)
  const mission = missionBrief(quickLevel)
  const snapshot = progression.snapshot()
  const profileCountry = countries.find((country) => country.code === profile.countryCode)
  const journeyLevels = [quickPlayLevel, Math.min(MAX_SUPPORTED_LEVEL_ID, quickPlayLevel + 1), Math.min(MAX_SUPPORTED_LEVEL_ID, quickPlayLevel + 2)]
  const playUi = () => { gameAudio.unlock(); gameAudio.playMusic('home'); gameAudio.play('uiClick') }
  const launchQuickPlay = () => { playUi(); onLaunchLevel(quickPlayLevel) }

  useEffect(() => {
    gameAudio.unlock()
    gameAudio.playMusic('home')
  }, [])

  return (
    <main className="home-dashboard" aria-label="Bubble Shooter Home Dashboard">
      <div className="dashboard-ambient" aria-hidden="true">
        <span className="ambient-glow ambient-glow--one" />
        <span className="ambient-glow ambient-glow--two" />
        <span className="home-space-current home-space-current--one" />
        <span className="home-space-current home-space-current--two" />
        <span className="home-space-track home-space-track--one" />
        <span className="home-space-track home-space-track--two" />
        <span className="home-space-track home-space-track--three" />
        <span className="home-edge-bubble home-edge-bubble--violet" />
        <span className="home-edge-bubble home-edge-bubble--red" />
        <span className="home-edge-bubble home-edge-bubble--green" />
        <span className="home-edge-bubble home-edge-bubble--gold" />
        <span className="home-drift-bubble home-drift-bubble--violet" />
        <span className="home-drift-bubble home-drift-bubble--blue" />
        <span className="home-drift-bubble home-drift-bubble--pink" />
        <span className="home-drift-bubble home-drift-bubble--gold" />
        <span className="home-drift-bubble home-drift-bubble--cyan" />
        {HOME_AMBIENT_ELEMENTS.map((bubble) => <span key={`${bubble.left}-${bubble.top}`} className={`ambient-bubble ambient-bubble--${bubble.color} ambient-bubble--${bubble.depth}`} style={{ left: bubble.left, top: bubble.top, width: bubble.size, height: bubble.size, '--ambient-duration': bubble.duration, '--ambient-delay': bubble.delay, '--ambient-drift-x': bubble.driftX, '--ambient-drift-y': bubble.driftY, '--ambient-rotate': bubble.driftRotate, '--ambient-scale': bubble.driftScale, '--ambient-loop-in-x': bubble.loopInX, '--ambient-loop-in-y': bubble.loopInY, '--ambient-loop-out-x': bubble.loopOutX, '--ambient-loop-out-y': bubble.loopOutY } as CSSProperties} />)}
      </div>

      <header className="dashboard-hud home-dashboard-hud">
        <button className="dashboard-profile" type="button" aria-label="Open your profile" onClick={() => { playUi(); onProfile() }}>
          <img className="dashboard-profile-avatar" src={`/avatars/${profile.avatarId}.png`} alt="" />
          <span className="dashboard-profile-copy"><strong>{profile.displayName || 'Player'}</strong><span className="dashboard-profile-flag" aria-label={profileCountry ? profileCountry.name : 'Country not selected'}>{profileCountry ? bubbleShooterFlagDisplay(profileCountry.emoji ?? profileCountry.code) : '🌐'}</span></span>
        </button>
        <button className="hud-settings" type="button" aria-label="Open settings" onClick={() => { playUi(); onSettings() }}><GameIcon name="settings" size={23} /></button>
      </header>

      <div className="home-dashboard-scroll">
        <section className="dashboard-hero home-continue-card" aria-label={`Continue playing level ${quickPlayLevel}`}>
          <div className="home-hero-art"><span className="home-hero-bubble hud-bubble hud-bubble--blue" /><span className="home-hero-orbit home-hero-orbit--one" /><span className="home-hero-orbit home-hero-orbit--two" /></div>
          <div className="home-hero-content">
            <span className="home-section-label">CONTINUE PLAYING</span>
            <h1>Level {quickPlayLevel.toLocaleString()}</h1>
            <span className="home-hero-count"><span className="home-mini-bubble hud-bubble hud-bubble--blue" />{mission.target.toLocaleString()} BUBBLES</span>
            <button className="hero-play" type="button" onClick={launchQuickPlay} disabled={quickState === 'locked'}><span>{quickState === 'completed' ? 'REPLAY' : 'PLAY'}</span><span className="hero-play-arrow"><GameIcon name="play" size={16} /></span></button>
          </div>
        </section>

        <section className="home-mission-card" aria-label={`${mission.label}: ${mission.target.toLocaleString()} remaining`}>
          <HomeMissionVisual mission={mission} />
          <div className="home-mission-copy"><span className="home-section-label">MISSION</span><strong>{mission.label}</strong><small>{mission.target.toLocaleString()} LEFT</small></div>
          <span className="home-mission-arrow"><GameIcon name="chevron" size={16} /></span>
        </section>

        <section className="home-journey-card" aria-label="Level journey preview">
          <div className="home-card-heading"><span><GameIcon name="map" size={17} /> LEVEL JOURNEY</span><button type="button" onClick={() => { playUi(); onMap() }}>VIEW MAP</button></div>
          <div className="home-journey-track">
            {journeyLevels.map((levelId, index) => {
              const state = getMapLevelState(levelId, highestUnlocked, progression.getRecord(levelId))
              return <span key={`${levelId}-${index}`} className="home-journey-step"><button type="button" className={`home-journey-node home-journey-node--${state}`} onClick={() => state !== 'locked' && onLaunchLevel(levelId)} disabled={state === 'locked'} aria-label={`Level ${levelId}, ${state}`}>{levelId}</button><small>LEVEL {levelId}</small></span>
            })}
          </div>
        </section>

        <section className="home-stars-card" aria-label={`${selectedStars} of 3 stars earned`}>
          <div className="home-card-heading"><span><GameIcon name="score" size={17} /> STAR PROGRESS</span><strong>{selectedStars}/3</strong></div>
          <div className="home-stars-row"><div className="home-stars"><span className={selectedStars >= 1 ? 'is-earned' : ''}>★</span><span className={selectedStars >= 2 ? 'is-earned' : ''}>★</span><span className={selectedStars >= 3 ? 'is-earned' : ''}>★</span></div><div className="home-stars-bar"><span style={{ width: `${Math.round((selectedStars / 3) * 100)}%` }} /></div></div>
        </section>
      </div>

      <nav className="dashboard-nav home-dashboard-nav" aria-label="Main navigation">
        <button className="nav-item is-active" type="button" aria-current="page"><GameIcon name="home" /><small>HOME</small></button>
        <button className="nav-item" type="button" onClick={() => { playUi(); onMap() }}><GameIcon name="map" /><small>MAP</small></button>
        <button className="nav-item" type="button" onClick={() => { playUi(); onProfile() }}><GameIcon name="user" /><small>PROFILE</small></button>
      </nav>

      {snapshot.lastWriteFailed ? <div className="dashboard-status" aria-live="polite">Progress saved locally when available</div> : null}
    </main>
  )
}
