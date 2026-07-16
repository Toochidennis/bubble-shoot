import { useEffect, useState } from 'react'

import { GameIcon } from '../components/GameIcon'
import { gameAudio } from '../game/audio/gameAudio'
import { getGamePreferences, setReducedMotion } from '../app/preferences'
import type { ProgressionRepository } from '../game/progression/ProgressionRepository'

interface SettingsScreenProps {
  readonly progression: ProgressionRepository
  readonly onBack: () => void
  readonly onResetProgress: () => void
}

function SettingToggle({ checked, label, ariaLabel, onChange }: { readonly checked: boolean; readonly label: string; readonly ariaLabel: string; readonly onChange: () => void }) {
  return <button type="button" className={`settings-toggle${checked ? ' is-on' : ''}`} aria-label={ariaLabel} aria-pressed={checked} onClick={onChange}><span>{label}</span><i aria-hidden="true" /></button>
}

export function SettingsScreen({ progression, onBack, onResetProgress }: SettingsScreenProps) {
  const [muted, setMuted] = useState(gameAudio.isMuted)
  const [musicMuted, setMusicMuted] = useState(gameAudio.isMusicMuted)
  const [volume, setVolume] = useState(gameAudio.masterVolumeValue)
  const [reducedMotion, setReducedMotionState] = useState(getGamePreferences().reducedMotion)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    gameAudio.playMusic('home')
  }, [])

  const unlockAndPlay = () => { gameAudio.unlock(); gameAudio.playMusic('home'); gameAudio.play('uiClick') }
  const toggleMuted = () => { unlockAndPlay(); setMuted(gameAudio.toggleMuted()) }
  const toggleMusic = () => { unlockAndPlay(); setMusicMuted(gameAudio.toggleMusicMuted()); if (!gameAudio.isMusicMuted) gameAudio.playMusic('home') }
  const changeVolume = (nextVolume: number) => { gameAudio.setMasterVolume(nextVolume); setVolume(nextVolume) }
  const toggleMotion = () => { unlockAndPlay(); setReducedMotionState(!reducedMotion); setReducedMotion(!reducedMotion) }
  const requestReset = () => { unlockAndPlay(); setConfirmReset(true) }
  const cancelReset = () => { unlockAndPlay(); setConfirmReset(false) }

  return (
    <main className="settings-screen" aria-label="Settings">
      <header className="settings-header">
        <button type="button" className="settings-back" onClick={() => { unlockAndPlay(); onBack() }}><GameIcon name="back" size={19} /> Back</button>
        <div><span className="settings-title-mark"><GameIcon name="settings" size={20} /></span><h1>Settings</h1></div>
      </header>

      <div className="settings-scroll">
        <section className="settings-section" aria-labelledby="sound-heading">
          <div className="settings-section-heading"><span className="settings-section-icon">♫</span><div><h2 id="sound-heading">Audio</h2><p>Make the bubble world feel right for you.</p></div></div>
          <div className="settings-row"><div><strong>Sound effects</strong><small>Shots, pops, bounces, and feedback</small></div><SettingToggle checked={!muted} ariaLabel={`Sound effects ${muted ? 'off' : 'on'}`} label={muted ? 'Off' : 'On'} onChange={toggleMuted} /></div>
          <div className="settings-row"><div><strong>Music</strong><small>Home and gameplay background loops</small></div><SettingToggle checked={!musicMuted} ariaLabel={`Music ${musicMuted ? 'off' : 'on'}`} label={musicMuted ? 'Off' : 'On'} onChange={toggleMusic} /></div>
          <div className="settings-row settings-volume-row"><div><strong>Master volume</strong><small>Music and effects</small></div><output>{Math.round(volume * 100)}%</output><input aria-label="Master volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} /></div>
          <button type="button" className="settings-test-button" onClick={() => { unlockAndPlay(); gameAudio.play('bubblePop') }}><span>Test sound</span><GameIcon name="play" size={16} /></button>
        </section>

        <section className="settings-section" aria-labelledby="motion-heading">
          <div className="settings-section-heading"><span className="settings-section-icon">✦</span><div><h2 id="motion-heading">Comfort</h2><p>Keep the action comfortable during play.</p></div></div>
          <div className="settings-row"><div><strong>Reduced motion</strong><small>Shorter, calmer visual effects</small></div><SettingToggle checked={reducedMotion} ariaLabel={`Reduced motion ${reducedMotion ? 'on' : 'off'}`} label={reducedMotion ? 'On' : 'Off'} onChange={toggleMotion} /></div>
        </section>

        <section className="settings-section" aria-labelledby="data-heading">
          <div className="settings-section-heading"><span className="settings-section-icon">⌁</span><div><h2 id="data-heading">Game data</h2><p>Your progress is stored on this device.</p></div></div>
          <div className="settings-row settings-row--danger"><div><strong>Reset progress</strong><small>Remove completed levels and saved stars</small></div><button type="button" className="settings-danger-button" onClick={requestReset}>Reset</button></div>
          {confirmReset ? <div className="settings-confirm" role="alert"><strong>Reset all progress?</strong><p>This cannot be undone.</p><div><button type="button" className="settings-danger-button" onClick={onResetProgress}>Reset everything</button><button type="button" className="settings-cancel-button" onClick={cancelReset}>Cancel</button></div></div> : null}
        </section>

        <section className="settings-section settings-about" aria-labelledby="about-heading">
          <div className="settings-section-heading"><span className="settings-section-icon">●</span><div><h2 id="about-heading">About</h2><p>Bubble Shooter</p></div></div>
          <div className="settings-about-meta"><span>Version 0.1.0</span><span>{progression.snapshot().save.schemaVersion === 1 ? 'Local save enabled' : 'Save ready'}</span></div>
          <a href="/audio/LICENSES.md" target="_blank" rel="noreferrer" onClick={unlockAndPlay}>Sound credits and licenses</a>
        </section>
      </div>
    </main>
  )
}
