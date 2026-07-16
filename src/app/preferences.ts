export interface GamePreferences {
  readonly reducedMotion: boolean
}

const PREFERENCES_KEY = 'bubble-shooter.preferences.v1'
export const PREFERENCES_CHANGED_EVENT = 'bubble-shooter:preferences-changed'
const DEFAULT_PREFERENCES: GamePreferences = { reducedMotion: false }

function readPreferences(): GamePreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY)
    if (raw === null) return DEFAULT_PREFERENCES
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return DEFAULT_PREFERENCES
    const record = parsed as { reducedMotion?: unknown }
    return { reducedMotion: record.reducedMotion === true }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

let preferences = readPreferences()

export function getGamePreferences(): GamePreferences {
  return preferences
}

export function setReducedMotion(reducedMotion: boolean): GamePreferences {
  preferences = { ...preferences, reducedMotion }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
      window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT))
    } catch {
      // Continue with the in-memory preference when storage is unavailable.
    }
  }
  return preferences
}

