export interface GameHostLayoutInsets {
  readonly bottom: number
}

export interface BubbleShooterHostBridge {
  setLayoutInsets(insets: GameHostLayoutInsets): void
  receive?(message: unknown): void
}

declare global {
  interface Window {
    BubbleShooterHost?: BubbleShooterHostBridge
  }
}

const MAX_HOST_BOTTOM_INSET = 180

function applyBottomInset(value: unknown): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) return
  const bottom = Math.round(Math.max(0, Math.min(MAX_HOST_BOTTOM_INSET, value)))
  document.documentElement.style.setProperty('--game-host-bottom-inset', `${bottom}px`)
}

/**
 * Lets the native WebView host reserve the exact space occupied by its banner.
 * The query parameter covers first paint; the JS method supports later changes.
 */
export function installGameHostLayoutBridge(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const queryValue = new URLSearchParams(window.location.search).get('nativeAdInset')
  if (queryValue !== null && queryValue.trim() !== '') applyBottomInset(Number(queryValue))

  const host: BubbleShooterHostBridge = window.BubbleShooterHost ?? {
    setLayoutInsets: () => undefined,
    receive: () => undefined,
  }
  host.setLayoutInsets = ({ bottom }) => applyBottomInset(bottom)
  window.BubbleShooterHost = host
}
