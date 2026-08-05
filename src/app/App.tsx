import { useEffect, useMemo, useState } from 'react'

import { createDefaultProgressionRepository } from '../game/progression/ProgressionRepository'
import { HomeDashboard } from '../screens/HomeDashboard'
import { SpaceBackground } from '../screens/SpaceBackground'
import { FoundationScreen } from '../screens/FoundationScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { MapScreen } from '../screens/MapScreen'
import { loadBubbleShooterCatalogs, useBubbleShooterCatalogStore } from '../game/catalog/bubbleShooterCatalogStore'
import { useBubbleShooterProfile } from '../game/profile/bubbleShooterProfile'

type Screen = 'home' | 'map' | 'gameplay' | 'settings' | 'profile'

interface NavState {
  readonly screen: Screen
  readonly activeLevel: number
}

export function App() {
  const progression = useMemo(() => createDefaultProgressionRepository(), [])
  const [screen, setScreen] = useState<Screen>('home')
  const [activeLevel, setActiveLevel] = useState(1)
  const [progressionRevision, setProgressionRevision] = useState(0)
  const [profile, setProfile] = useBubbleShooterProfile()
  const catalog = useBubbleShooterCatalogStore()

  useEffect(() => { void loadBubbleShooterCatalogs() }, [])

  // Mirror the current screen into the browser history so the browser/OS back
  // and forward buttons (and the Android back gesture) move between screens just
  // like the in-app arrows, instead of leaving the app. The screen lives in
  // history.state; forward navigation pushes an entry, and "back" simply pops.
  useEffect(() => {
    window.history.replaceState({ screen: 'home', activeLevel: 1 } satisfies NavState, '')
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as Partial<NavState> | null
      setScreen(state?.screen ?? 'home')
      if (typeof state?.activeLevel === 'number') setActiveLevel(state.activeLevel)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (nextScreen: Screen, level?: number) => {
    const nextLevel = level ?? activeLevel
    if (level !== undefined) setActiveLevel(level)
    window.history.pushState({ screen: nextScreen, activeLevel: nextLevel } satisfies NavState, '')
    setScreen(nextScreen)
  }
  const goBack = () => window.history.back()

  const launchLevel = (levelId: number) => {
    if (!progression.isLevelUnlocked(levelId)) return
    navigate('gameplay', levelId)
  }

  return (
    <main className="app-shell">
      {screen !== 'gameplay' ? <SpaceBackground /> : null}
      {screen === 'home' ? (
        <HomeDashboard key={progressionRevision} profile={profile} countries={catalog.countries} progression={progression} onLaunchLevel={launchLevel} onSettings={() => navigate('settings')} onProfile={() => navigate('profile')} onMap={() => navigate('map')} />
      ) : screen === 'map' ? (
        <MapScreen progression={progression} onHome={goBack} onProfile={() => navigate('profile')} onLaunchLevel={launchLevel} />
      ) : screen === 'gameplay' ? (
        <FoundationScreen key={activeLevel} levelId={activeLevel} progression={progression} onHome={goBack} onNextLevel={launchLevel} />
      ) : screen === 'profile' ? (
        <ProfileScreen profile={profile} catalog={catalog} onBack={goBack} onSave={(nextProfile) => { setProfile(nextProfile); goBack() }} />
      ) : (
        <SettingsScreen progression={progression} onBack={goBack} onResetProgress={() => { progression.clear(); setProgressionRevision((revision) => revision + 1); goBack() }} />
      )}
    </main>
  )
}
