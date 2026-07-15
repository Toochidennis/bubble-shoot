import { useMemo, useState } from 'react'

import { createDefaultProgressionRepository } from '../game/progression/ProgressionRepository'
import { HomeDashboard } from '../screens/HomeDashboard'
import { FoundationScreen } from '../screens/FoundationScreen'

export function App() {
  const progression = useMemo(() => createDefaultProgressionRepository(), [])
  const [screen, setScreen] = useState<'home' | 'gameplay'>('home')
  const [activeLevel, setActiveLevel] = useState(1)

  const launchLevel = (levelId: number) => {
    if (!progression.isLevelUnlocked(levelId)) return
    setActiveLevel(levelId)
    setScreen('gameplay')
  }

  return (
    <main className="app-shell">
      {screen === 'home' ? <HomeDashboard progression={progression} onLaunchLevel={launchLevel} /> : <FoundationScreen key={activeLevel} levelId={activeLevel} progression={progression} onHome={() => setScreen('home')} onNextLevel={launchLevel} />}
    </main>
  )
}
