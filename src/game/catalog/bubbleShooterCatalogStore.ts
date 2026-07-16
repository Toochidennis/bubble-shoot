import { useSyncExternalStore } from 'react'

import { loadBubbleShooterCountries, loadBubbleShooterLanguages, type CatalogLoadResult } from './bubbleShooterCatalogService'
import type { BubbleShooterCatalogState } from './bubbleShooterCatalogTypes'

const initialState: BubbleShooterCatalogState = { countries: [], languages: [], status: 'idle', error: null, stale: false }
let state = initialState
let loadingPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function publish(next: BubbleShooterCatalogState): void {
  state = next
  listeners.forEach((listener) => listener())
}

export function getBubbleShooterCatalogState(): BubbleShooterCatalogState { return state }

export function subscribeBubbleShooterCatalog(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function loadBubbleShooterCatalogs(): Promise<void> {
  if (loadingPromise !== null) return loadingPromise
  publish({ ...state, status: 'loading', error: null })
  loadingPromise = Promise.allSettled([loadBubbleShooterCountries(), loadBubbleShooterLanguages()]).then((results) => {
    const countries = results[0].status === 'fulfilled' ? results[0].value as CatalogLoadResult<typeof state.countries> : null
    const languages = results[1].status === 'fulfilled' ? results[1].value as CatalogLoadResult<typeof state.languages> : null
    const errors = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    publish({
      countries: countries?.data ?? state.countries,
      languages: languages?.data ?? state.languages,
      status: countries !== null || languages !== null ? 'ready' : 'error',
      error: errors.length > 0 ? errors.map((error) => error.reason instanceof Error ? error.reason.message : 'Catalog request failed').join(' · ') : null,
      stale: Boolean(countries?.stale || languages?.stale),
    })
  }).finally(() => { loadingPromise = null })
  return loadingPromise
}

export function useBubbleShooterCatalogStore(): BubbleShooterCatalogState {
  return useSyncExternalStore(subscribeBubbleShooterCatalog, getBubbleShooterCatalogState, getBubbleShooterCatalogState)
}

