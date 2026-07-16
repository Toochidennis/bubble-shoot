export interface BubbleShooterCountryOption {
  readonly code: string
  readonly name: string
  readonly emoji?: string
  readonly image?: string
}

export interface BubbleShooterLanguageOption {
  readonly code: string
  readonly label: string
  readonly name: string
  readonly flag: string
  readonly locale: string
  readonly direction: 'ltr' | 'rtl'
  readonly isDefault: boolean
}

export type BubbleShooterCatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface BubbleShooterCatalogState {
  readonly countries: readonly BubbleShooterCountryOption[]
  readonly languages: readonly BubbleShooterLanguageOption[]
  readonly status: BubbleShooterCatalogStatus
  readonly error: string | null
  readonly stale: boolean
}

