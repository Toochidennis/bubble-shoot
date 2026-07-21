import { useEffect, useMemo, useRef, useState } from 'react'

import { GameIcon } from '../components/GameIcon'
import { CountryFlag } from '../components/CountryFlag'
import type { BubbleShooterCatalogState } from '../game/catalog/bubbleShooterCatalogTypes'
import type { BubbleShooterProfile } from '../game/profile/bubbleShooterProfile'
import { BUBBLE_SHOOTER_AVATARS } from '../game/profile/avatarCatalog'
import { gameAudio } from '../game/audio/gameAudio'

interface ProfileScreenProps {
  readonly profile: BubbleShooterProfile
  readonly catalog: BubbleShooterCatalogState
  readonly onBack: () => void
  readonly onSave: (profile: BubbleShooterProfile) => void
}

function matches(value: string, query: string): boolean {
  return value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
}

export function ProfileScreen({ profile, catalog, onBack, onSave }: ProfileScreenProps) {
  const [draft, setDraft] = useState(profile)
  const [countryQuery, setCountryQuery] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const countryPickerRef = useRef<HTMLDivElement>(null)
  const filteredCountries = useMemo(() => catalog.countries.filter((country) => matches(`${country.name} ${country.code}`, countryQuery)), [catalog.countries, countryQuery])
  const selectedCountry = catalog.countries.find((country) => country.code === draft.countryCode)
  const save = () => { gameAudio.unlock(); gameAudio.play('uiClick'); onSave(draft) }

  useEffect(() => {
    if (!countryOpen) return undefined
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!countryPickerRef.current?.contains(event.target as Node)) setCountryOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCountryOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [countryOpen])

  return (
    <main className="profile-screen" aria-label="Player profile">
      <header className="profile-header">
        <button type="button" className="profile-back" onClick={() => { gameAudio.unlock(); gameAudio.play('uiClick'); onBack() }}><GameIcon name="back" size={19} /> Back</button>
        <div className="profile-title"><span className="profile-title-mark"><GameIcon name="user" size={20} /></span><div><h1>Your Profile</h1><p>Make this bubble journey yours.</p></div></div>
        <button type="button" className="profile-save profile-save--header" onClick={save}>Save</button>
      </header>

      <div className="profile-scroll">
        <section className="profile-identity-panel" aria-labelledby="profile-identity-heading">
          <div className="profile-identity-preview"><img src={`/avatars/${draft.avatarId}.png`} alt="Selected avatar" /><span className="profile-identity-glow" /></div>
          <div><span className="profile-kicker">PLAYER PROFILE</span><h2 id="profile-identity-heading">{draft.displayName || 'Player'}</h2><p className="profile-identity-country">{selectedCountry ? <><CountryFlag country={selectedCountry} className="country-flag--inline" />{selectedCountry.name}</> : 'Choose your country to personalize your profile.'}</p></div>
        </section>

        <section className="profile-section" aria-labelledby="avatar-heading">
          <div className="profile-section-heading"><div><h2 id="avatar-heading">Choose an avatar</h2><p>Pick the face that represents you in Bubble Shooter.</p></div><span className="profile-section-count">{BUBBLE_SHOOTER_AVATARS.length}</span></div>
          <div className="avatar-grid" role="radiogroup" aria-label="Available avatars">
            {BUBBLE_SHOOTER_AVATARS.map((avatar) => <button key={avatar.id} type="button" className={`avatar-choice${draft.avatarId === avatar.id ? ' is-selected' : ''}`} role="radio" aria-checked={draft.avatarId === avatar.id} aria-label={avatar.label} onClick={() => { gameAudio.unlock(); gameAudio.play('uiClick'); setDraft((current) => ({ ...current, avatarId: avatar.id })) }}><img src={avatar.src} alt="" /></button>)}
          </div>
        </section>

        <section className="profile-section" aria-labelledby="details-heading">
          <div className="profile-section-heading"><div><h2 id="details-heading">Player details</h2><p>These details stay on this device until you save them.</p></div></div>
          <label className="profile-field"><span>Display name</span><input maxLength={24} value={draft.displayName} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))} placeholder="Player" /></label>
          <div className="profile-field-group">
            <div className="profile-field profile-country-picker" ref={countryPickerRef}>
              <span>Country</span>
              <button type="button" className={`profile-country-trigger${countryOpen ? ' is-open' : ''}`} aria-haspopup="listbox" aria-expanded={countryOpen} aria-controls="country-options" disabled={catalog.status === 'loading'} onClick={() => { gameAudio.unlock(); gameAudio.play('uiClick'); setCountryOpen((open) => !open); setCountryQuery('') }}>
                {selectedCountry ? <span className="profile-country-current"><CountryFlag country={selectedCountry} /><span className="profile-country-current-name">{selectedCountry.name}</span></span> : <span>Select country</span>}<GameIcon name="chevron" size={14} />
              </button>
              {countryOpen ? <div className="profile-country-menu" id="country-options" role="listbox" aria-label="Countries">
                <input className="profile-country-search" type="search" autoFocus value={countryQuery} onChange={(event) => setCountryQuery(event.target.value)} placeholder="Search countries" aria-label="Search countries" />
                <div className="profile-country-options">
                  {filteredCountries.length > 0 ? filteredCountries.map((country) => <button key={country.code} type="button" role="option" aria-selected={draft.countryCode === country.code} className={`profile-country-option${draft.countryCode === country.code ? ' is-selected' : ''}`} onClick={() => { gameAudio.unlock(); gameAudio.play('uiClick'); setDraft((current) => ({ ...current, countryCode: country.code })); setCountryOpen(false); setCountryQuery('') }}><CountryFlag country={country} /><span className="profile-country-option-copy"><strong>{country.name}</strong></span></button>) : <p className="profile-country-empty">No countries match that search.</p>}
                </div>
              </div> : null}
            </div>
          </div>
          {catalog.status === 'loading' ? <p className="profile-catalog-status">Loading countries…</p> : null}
          {catalog.error ? <p className="profile-catalog-status profile-catalog-status--error">Profile catalog unavailable right now. You can still save your avatar and name.</p> : null}
          {catalog.stale ? <p className="profile-catalog-status">Using cached catalog data.</p> : null}
        </section>

        <button type="button" className="profile-save" onClick={save}>Save profile</button>
      </div>
    </main>
  )
}
