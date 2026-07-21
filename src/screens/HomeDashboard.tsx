import { useEffect } from 'react'

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
import type { BubbleShooterProfile } from '../game/profile/bubbleShooterProfile'
import { CountryFlag } from '../components/CountryFlag'
import { formatCompactCount } from '../utils/formatCount'
import { useReducedMotion } from '../app/useReducedMotion'

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
  readonly color: BubbleColor
  readonly allColors: boolean
}

function missionBrief(level: NormalizedLevelDefinition | null): MissionBrief {
  const fallback: MissionBrief = { label: 'CLEAR ALL', color: 'blue', allColors: true }
  if (level === null) return fallback
  const mission: MissionConfiguration = level.mission.type === 'MISSION_SET' ? level.mission.objectives[0] ?? { type: 'CLEAR_ALL_BUBBLES' } : level.mission
  switch (mission.type) {
    case 'POP_COLOR': return { label: `POP ${mission.targetColor.toUpperCase()}`, color: mission.targetColor, allColors: false }
    case 'DROP_BUBBLES': return { label: 'DROP BUBBLES', color: 'green', allColors: false }
    case 'CLEAR_MARKED': return { label: 'CLEAR TARGETS', color: 'purple', allColors: false }
    case 'REACH_SCORE': return { label: 'REACH SCORE', color: 'yellow', allColors: false }
    case 'CLEAR_ALL_BUBBLES': return { label: 'CLEAR ALL', color: 'blue', allColors: true }
  }
}

export function HomeDashboard({ profile, countries, progression, onLaunchLevel, onSettings, onProfile, onMap }: HomeDashboardProps) {
  const reducedMotion = useReducedMotion()
  const highestUnlocked = progression.highestUnlockedLevel
  const quickPlayLevel = getQuickPlayLevel(highestUnlocked, MAX_SUPPORTED_LEVEL_ID)
  const quickLevelResult = getLevel(quickPlayLevel)
  const quickLevel = quickLevelResult.ok ? quickLevelResult.level : null
  const quickState = getMapLevelState(quickPlayLevel, highestUnlocked, progression.getRecord(quickPlayLevel))
  const mission = missionBrief(quickLevel)
  const snapshot = progression.snapshot()
  const profileCountry = countries.find((country) => country.code === profile.countryCode)

  // Star total only — never expose how many levels exist.
  const totalStars = Object.values(snapshot.save.completionRecords).reduce((sum, record) => sum + record.bestStars, 0)

  const playUi = () => { gameAudio.unlock(); gameAudio.playMusic('home'); gameAudio.play('uiClick') }
  const launchQuickPlay = () => { playUi(); onLaunchLevel(quickPlayLevel) }

  useEffect(() => {
    gameAudio.unlock()
    gameAudio.playMusic('home')
  }, [])

  return (
    <main className={`home-screen${reducedMotion ? ' home-screen--still' : ''}`} aria-label="Bubble Shooter Home">
      <header className="home-topbar">
        <button className="home-avatar" type="button" aria-label="Open your profile" onClick={() => { playUi(); onProfile() }}>
          <img className="home-avatar-photo" src={`/avatars/${profile.avatarId}.png`} alt="" />
          <span className="home-avatar-name">{profile.displayName || 'Player'}</span>
          {profileCountry ? <CountryFlag country={profileCountry} className="home-avatar-flag" /> : <span className="home-avatar-flag" aria-label="Country not selected">🌐</span>}
        </button>
        <div className="home-topbar-right">
          <span className="home-pill home-pill--stars" aria-label={`${totalStars.toLocaleString()} stars collected`}><i>★</i>{formatCompactCount(totalStars)}</span>
          <button className="home-gear" type="button" aria-label="Open settings" onClick={() => { playUi(); onSettings() }}><GameIcon name="settings" size={22} /></button>
        </div>
      </header>

      <div className="home-stage">
        <div className="home-mascot" aria-hidden="true">
          <span className="home-mascot-orbit home-mascot-orbit--one" />
          <span className="home-mascot-orbit home-mascot-orbit--two" />
          <span className="home-mascot-bubble hud-bubble hud-bubble--blue" />
          <span className="home-mascot-mini home-mascot-mini--pink" />
          <span className="home-mascot-mini home-mascot-mini--green" />
          <span className="home-mascot-mini home-mascot-mini--gold" />
        </div>

        <span className="home-level-kicker">CONTINUE PLAYING</span>
        <h1 className="home-level">Level {quickPlayLevel.toLocaleString()}</h1>
        <span className={`home-mission${mission.allColors ? ' home-mission--all' : ` home-mission--${mission.color}`}`}>
          <i aria-hidden="true" />{mission.label}
        </span>

        <button className="home-play" type="button" onClick={launchQuickPlay} disabled={quickState === 'locked'}>
          <span className="home-play-label">{quickState === 'completed' ? 'REPLAY' : 'PLAY'}</span>
          <span className="home-play-arrow"><GameIcon name="play" size={18} /></span>
        </button>
      </div>

      <nav className="home-tabbar" aria-label="Main navigation">
        <button className="home-tab is-active" type="button" aria-current="page"><GameIcon name="home" /><small>HOME</small></button>
        <button className="home-tab" type="button" onClick={() => { playUi(); onMap() }}><GameIcon name="map" /><small>MAP</small></button>
        <button className="home-tab" type="button" onClick={() => { playUi(); onProfile() }}><GameIcon name="user" /><small>PROFILE</small></button>
      </nav>

      {snapshot.lastWriteFailed ? <p className="home-status" aria-live="polite">Progress saved locally when available</p> : null}
    </main>
  )
}
