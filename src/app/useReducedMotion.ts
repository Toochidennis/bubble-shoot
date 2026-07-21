import { useEffect, useState } from 'react'

import { getGamePreferences, PREFERENCES_CHANGED_EVENT } from './preferences'

function computeReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return getGamePreferences().reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Tracks whether motion should be reduced, combining the in-game "Reduced motion"
 * preference with the OS-level `prefers-reduced-motion` query. Screens use this to
 * pause decorative/idle animations.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(computeReducedMotion)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(computeReducedMotion())
    window.addEventListener(PREFERENCES_CHANGED_EVENT, update)
    media.addEventListener('change', update)
    return () => {
      window.removeEventListener(PREFERENCES_CHANGED_EVENT, update)
      media.removeEventListener('change', update)
    }
  }, [])

  return reduced
}
