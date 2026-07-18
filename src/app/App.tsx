import { useEffect, useMemo, useState } from 'react'

import { createDefaultProgressionRepository } from '../game/progression/ProgressionRepository'
import { HomeDashboard } from '../screens/HomeDashboard'
import { FoundationScreen } from '../screens/FoundationScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { MapScreen } from '../screens/MapScreen'
import { loadBubbleShooterCatalogs, useBubbleShooterCatalogStore } from '../game/catalog/bubbleShooterCatalogStore'
import { useBubbleShooterProfile } from '../game/profile/bubbleShooterProfile'

export function App() {
  const progression = useMemo(() => createDefaultProgressionRepository(), [])
  const [screen, setScreen] = useState<'home' | 'map' | 'gameplay' | 'settings' | 'profile'>('home')
  const [activeLevel, setActiveLevel] = useState(1)
  const [progressionRevision, setProgressionRevision] = useState(0)
  const [profile, setProfile] = useBubbleShooterProfile()
  const catalog = useBubbleShooterCatalogStore()

  useEffect(() => { void loadBubbleShooterCatalogs() }, [])

  const launchLevel = (levelId: number) => {
    if (!progression.isLevelUnlocked(levelId)) return
    setActiveLevel(levelId)
    setScreen('gameplay')
  }

  return (
    <main className="app-shell">
      {screen === 'home' ? <HomeDashboard key={progressionRevision} profile={profile} countries={catalog.countries} progression={progression} onLaunchLevel={launchLevel} onSettings={() => setScreen('settings')} onProfile={() => setScreen('profile')} onMap={() => setScreen('map')} /> : screen === 'map' ? <MapScreen progression={progression} onHome={() => setScreen('home')} onProfile={() => setScreen('profile')} onLaunchLevel={launchLevel} /> : screen === 'gameplay' ? <FoundationScreen key={activeLevel} levelId={activeLevel} progression={progression} onHome={() => setScreen('home')} onNextLevel={launchLevel} /> : screen === 'profile' ? <ProfileScreen profile={profile} catalog={catalog} onBack={() => setScreen('home')} onSave={(nextProfile) => { setProfile(nextProfile); setScreen('home') }} /> : <SettingsScreen progression={progression} onBack={() => setScreen('home')} onResetProgress={() => { progression.clear(); setProgressionRevision((revision) => revision + 1); setScreen('home') }} />}
    </main>
  )
}
