export interface ProgressStorage {
  read(): string | null
  write(value: string): void
  remove?(): void
}

export const PROGRESS_STORAGE_KEY = 'bubble-shooter.progress.v1'

export class LocalStorageProgressStorage implements ProgressStorage {
  public read(): string | null {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(PROGRESS_STORAGE_KEY)
  }

  public write(value: string): void {
    if (typeof window !== 'undefined') window.localStorage.setItem(PROGRESS_STORAGE_KEY, value)
  }

  public remove(): void {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(PROGRESS_STORAGE_KEY)
    } catch {
      // Ignore unavailable storage.
    }
  }
}
