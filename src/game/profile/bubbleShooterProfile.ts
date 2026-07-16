import { useState } from 'react'

import { BUBBLE_SHOOTER_AVATARS } from './avatarCatalog'

export interface BubbleShooterProfile {
  readonly displayName: string
  readonly avatarId: string
  readonly countryCode: string
  readonly languageCode: string
}

export const BUBBLE_SHOOTER_PROFILE_KEY = 'bubble-shooter.profile.v1'
export const DEFAULT_BUBBLE_SHOOTER_PROFILE: BubbleShooterProfile = { displayName: 'Player', avatarId: 'avatar-01', countryCode: '', languageCode: 'en' }

function readProfile(): BubbleShooterProfile {
  if (typeof window === 'undefined') return DEFAULT_BUBBLE_SHOOTER_PROFILE
  try {
    const raw = window.localStorage.getItem(BUBBLE_SHOOTER_PROFILE_KEY)
    if (raw === null) return DEFAULT_BUBBLE_SHOOTER_PROFILE
    const value = JSON.parse(raw) as Partial<BubbleShooterProfile>
    return {
      displayName: typeof value.displayName === 'string' && value.displayName.trim() ? value.displayName.trim().slice(0, 24) : DEFAULT_BUBBLE_SHOOTER_PROFILE.displayName,
      avatarId: typeof value.avatarId === 'string' && BUBBLE_SHOOTER_AVATARS.some((avatar) => avatar.id === value.avatarId) ? value.avatarId : DEFAULT_BUBBLE_SHOOTER_PROFILE.avatarId,
      countryCode: typeof value.countryCode === 'string' ? value.countryCode.toUpperCase() : '',
      languageCode: typeof value.languageCode === 'string' ? value.languageCode : DEFAULT_BUBBLE_SHOOTER_PROFILE.languageCode,
    }
  } catch { return DEFAULT_BUBBLE_SHOOTER_PROFILE }
}

export function readBubbleShooterProfile(): BubbleShooterProfile { return readProfile() }

export function saveBubbleShooterProfile(profile: BubbleShooterProfile): BubbleShooterProfile {
  const normalized = { ...profile, displayName: profile.displayName.trim().slice(0, 24) || DEFAULT_BUBBLE_SHOOTER_PROFILE.displayName, countryCode: profile.countryCode.toUpperCase() }
  try { window.localStorage.setItem(BUBBLE_SHOOTER_PROFILE_KEY, JSON.stringify(normalized)) } catch { /* Continue with in-memory state. */ }
  return normalized
}

export function useBubbleShooterProfile(): [BubbleShooterProfile, (profile: BubbleShooterProfile) => void] {
  const [profile, setProfile] = useState(readProfile)
  return [profile, (next) => setProfile(saveBubbleShooterProfile(next))]
}
