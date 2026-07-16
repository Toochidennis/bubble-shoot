import type { BubbleShooterCountryOption, BubbleShooterLanguageOption } from './bubbleShooterCatalogTypes'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'https://linkskool.net/api/v4'
const API_KEY = (import.meta.env.VITE_API_KEY as string | undefined) ?? ''
const COUNTRIES_CACHE_KEY = 'bubble-shooter-countries-v1'
const CATALOG_DB_NAME = 'bubble-shooter-catalog'
const CATALOG_DB_VERSION = 1
const LANGUAGE_STORE_NAME = 'languages'
const LANGUAGE_RECORD_KEY = 'catalog'
const LANGUAGE_CACHE_TTL = 4 * 24 * 60 * 60 * 1000

interface ApiEnvelope {
  readonly success?: boolean
  readonly message?: string
  readonly data?: unknown
}

interface CachedLanguages {
  readonly savedAt: number
  readonly data: BubbleShooterLanguageOption[]
}

export interface CatalogLoadResult<T> {
  readonly data: T
  readonly stale: boolean
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isActive(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

function normalizeDirection(value: unknown, locale: string): 'ltr' | 'rtl' {
  if (value === 'rtl') return 'rtl'
  if (value === 'ltr') return 'ltr'
  return /^(ar|fa|he|ur)([-_]|$)/i.test(locale) ? 'rtl' : 'ltr'
}

function regionalIndicatorToCode(value: string): string {
  const points = [...value].map((character) => character.codePointAt(0) ?? 0)
  if (points.length !== 2 || points.some((point) => point < 0x1f1e6 || point > 0x1f1ff)) return ''
  return points.map((point) => String.fromCharCode(point - 0x1f1e6 + 65)).join('')
}

export function normalizeBubbleShooterFlag(value: unknown): string {
  const flag = asString(value)
  if (!flag) return ''
  return regionalIndicatorToCode(flag) || flag
}

function normalizeCountries(value: unknown): BubbleShooterCountryOption[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const record = asRecord(entry)
    if (record === null) return []
    const code = asString(record.code).toUpperCase()
    const name = asString(record.name)
    if (!code || !name) return []
    const emoji = asString(record.emoji)
    const image = asString(record.image)
    return [{ code, name, ...(emoji ? { emoji } : {}), ...(image ? { image } : {}) }]
  })
}

function normalizeLanguages(value: unknown): BubbleShooterLanguageOption[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const record = asRecord(entry)
    if (record === null || !isActive(record.is_active)) return []
    const code = asString(record.code)
    const name = asString(record.name)
    if (!code || !name) return []
    const locale = asString(record.locale) || code
    const label = asString(record.native_name) || name
    return [{
      code,
      label,
      name,
      flag: normalizeBubbleShooterFlag(record.flag),
      locale,
      direction: normalizeDirection(record.direction, locale),
      isDefault: record.is_default === true || record.is_default === 1 || record.is_default === '1',
    }]
  })
}

function normalizeCachedLanguages(value: unknown): BubbleShooterLanguageOption[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const record = asRecord(entry)
    if (record === null) return []
    const code = asString(record.code)
    const name = asString(record.name)
    const label = asString(record.label) || name
    const locale = asString(record.locale) || code
    if (!code || !name || !label) return []
    return [{ code, label, name, flag: normalizeBubbleShooterFlag(record.flag), locale, direction: normalizeDirection(record.direction, locale), isDefault: record.isDefault === true }]
  })
}

async function requestCatalog<T>(path: string, normalize: (value: unknown) => T): Promise<T> {
  if (!API_KEY) throw new Error('Catalog API key is not configured')
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, { headers: { 'x-api-key': API_KEY, Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Catalog request failed (${response.status})`)
  const payload = await response.json() as ApiEnvelope
  if (payload.success === false) throw new Error(payload.message || 'Catalog request failed')
  return normalize(payload.data)
}

function readCountriesCache(): BubbleShooterCountryOption[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(COUNTRIES_CACHE_KEY)
    if (raw === null) return null
    const data = normalizeCountries(JSON.parse(raw))
    return data.length > 0 ? data : null
  } catch {
    return null
  }
}

function writeCountriesCache(data: BubbleShooterCountryOption[]): void {
  try { window.localStorage.setItem(COUNTRIES_CACHE_KEY, JSON.stringify(data)) } catch { /* Continue without cache. */ }
}

function openLanguageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return }
    const request = indexedDB.open(CATALOG_DB_NAME, CATALOG_DB_VERSION)
    request.onupgradeneeded = () => request.result.createObjectStore(LANGUAGE_STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

async function readLanguageCache(): Promise<CachedLanguages | null> {
  try {
    const database = await openLanguageDatabase()
    return await new Promise((resolve) => {
      const request = database.transaction(LANGUAGE_STORE_NAME, 'readonly').objectStore(LANGUAGE_STORE_NAME).get(LANGUAGE_RECORD_KEY)
      request.onsuccess = () => {
        const record = asRecord(request.result)
        const data = record === null ? [] : normalizeCachedLanguages(record.data)
        resolve(typeof record?.savedAt === 'number' && data.length > 0 ? { savedAt: record.savedAt, data } : null)
      }
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function writeLanguageCache(data: BubbleShooterLanguageOption[]): Promise<void> {
  try {
    const database = await openLanguageDatabase()
    await new Promise<void>((resolve) => {
      const request = database.transaction(LANGUAGE_STORE_NAME, 'readwrite').objectStore(LANGUAGE_STORE_NAME).put({ savedAt: Date.now(), data }, LANGUAGE_RECORD_KEY)
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
    })
  } catch { /* Continue without IndexedDB. */ }
}

export async function loadBubbleShooterCountries(): Promise<CatalogLoadResult<BubbleShooterCountryOption[]>> {
  const cached = readCountriesCache()
  if (cached !== null) return { data: cached, stale: false }
  try {
    const data = await requestCatalog('/public/games/countries', normalizeCountries)
    if (data.length === 0) throw new Error('Country catalog is empty')
    writeCountriesCache(data)
    return { data, stale: false }
  } catch (error) {
    const fallback = readCountriesCache()
    if (fallback !== null) return { data: fallback, stale: true }
    throw error
  }
}

export async function loadBubbleShooterLanguages(): Promise<CatalogLoadResult<BubbleShooterLanguageOption[]>> {
  const cached = await readLanguageCache()
  if (cached !== null && Date.now() - cached.savedAt < LANGUAGE_CACHE_TTL) return { data: cached.data, stale: false }
  try {
    const data = await requestCatalog('/public/games/languages', normalizeLanguages)
    if (data.length === 0) throw new Error('Language catalog is empty')
    await writeLanguageCache(data)
    return { data, stale: false }
  } catch (error) {
    if (cached !== null) return { data: cached.data, stale: true }
    throw error
  }
}
