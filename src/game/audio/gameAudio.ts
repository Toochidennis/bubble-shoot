import { Howl, Howler } from 'howler'

export type GameAudioEvent =
  | 'shot'
  | 'wallBounce'
  | 'bubblePop'
  | 'matchBurst'
  | 'dropBubble'
  | 'uiClick'
  | 'pause'
  | 'win'
  | 'lose'

export type GameMusicScene = 'home' | 'gameplay'

export interface GameAudioPlayOptions {
  readonly rate?: number
  readonly volume?: number
}

interface AudioDefinition {
  readonly sources: readonly string[]
  readonly volume: number
  readonly rate: number
}

/**
 * Local, preload-safe sound mapping. The files are deliberately small OGG
 * assets so mobile gameplay never waits on a remote request before firing.
 */
export const GAME_AUDIO_DEFINITIONS: Readonly<Record<GameAudioEvent, AudioDefinition>> = {
  shot: { sources: ['/audio/laser2.ogg'], volume: .2, rate: 1.08 },
  wallBounce: { sources: ['/audio/tone1.ogg'], volume: .14, rate: 1.28 },
  // Glass-impact variants keep bubble matches crisp and jewel-like instead of
  // sounding like a toy power-up. Separate variants prevent rapid cascades
  // from repeating one identical transient.
  bubblePop: {
    sources: [
      '/audio/impactGlass_light_000.ogg',
      '/audio/impactGlass_light_001.ogg',
      '/audio/impactGlass_light_002.ogg',
      '/audio/impactGlass_light_003.ogg',
      '/audio/impactGlass_light_004.ogg',
    ],
    volume: .24,
    rate: 1.04,
  },
  matchBurst: {
    sources: [
      '/audio/impactGlass_medium_000.ogg',
      '/audio/impactGlass_medium_001.ogg',
      '/audio/impactGlass_medium_002.ogg',
      '/audio/impactGlass_medium_003.ogg',
      '/audio/impactGlass_medium_004.ogg',
    ],
    volume: .2,
    rate: .98,
  },
  dropBubble: { sources: ['/audio/spaceTrash2.ogg'], volume: .16, rate: 1.08 },
  uiClick: { sources: ['/audio/tone1.ogg'], volume: .11, rate: 1.55 },
  pause: { sources: ['/audio/lowDown.ogg'], volume: .16, rate: 1.1 },
  // A dedicated short victory sting keeps the terminal modal celebratory
  // without reusing the old toy-like power-up cue.
  win: { sources: ['/audio/jingles-hit_08.ogg'], volume: .28, rate: .98 },
  lose: { sources: ['/audio/lowRandom.ogg'], volume: .2, rate: .86 },
}

export const GAME_MUSIC_SOURCES: Readonly<Record<GameMusicScene, string>> = {
  home: '/audio/home-music.ogg',
  gameplay: '/audio/gameplay-music.ogg',
}

const MAX_MASTER_VOLUME = 1

function canUseAudio(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined'
}

/**
 * A single Howler owner for the game. Audio remains silent until the first
 * pointer/click gesture calls unlock(), which keeps iOS/Android autoplay
 * policies happy without coupling audio state to React rendering.
 */
export class GameAudioController {
  private readonly sounds = new Map<GameAudioEvent, readonly Howl[]>()
  private readonly cursors = new Map<GameAudioEvent, number>()
  private unlocked = false
  private muted = false
  private musicMuted = false
  private lifecycleBound = false
  private backgrounded = false
  private resumeMusicOnForeground = false
  private requestedMusicScene: GameMusicScene | null = null
  private masterVolume = .82
  private music: Howl | null = null
  private musicScene: GameMusicScene | null = null
  private musicVolume = .22

  public unlock(): void {
    if (!canUseAudio()) return
    this.bindLifecycleListeners()
    this.unlocked = true
    Howler.mute(false)
    const context = Howler.ctx
    if (context?.state === 'suspended') void context.resume()
    if (this.requestedMusicScene !== null && !this.musicMuted && !this.backgrounded) {
      this.playMusic(this.requestedMusicScene)
    }
  }

  public play(event: GameAudioEvent, options: GameAudioPlayOptions = {}): void {
    this.bindLifecycleListeners()
    if (!canUseAudio() || !this.unlocked || this.muted || this.backgrounded) return
    const definition = GAME_AUDIO_DEFINITIONS[event]
    const variants = this.getSounds(event, definition)
    if (variants.length === 0) return
    const cursor = this.cursors.get(event) ?? 0
    this.cursors.set(event, cursor + 1)
    const sound = variants[cursor % variants.length]
    if (sound === undefined) return
    const rate = Math.max(.45, Math.min(2.4, options.rate ?? definition.rate))
    const volume = Math.max(0, Math.min(1, (options.volume ?? definition.volume) * this.masterVolume))
    sound.rate(rate)
    sound.volume(volume)
    sound.play()
  }

  public playMusic(scene: GameMusicScene): void {
    this.bindLifecycleListeners()
    this.requestedMusicScene = scene
    if (!canUseAudio() || !this.unlocked || this.musicMuted || this.backgrounded) return
    if (this.musicScene === scene && this.music !== null) {
      if (!this.music.playing()) this.music.play()
      return
    }
    const previous = this.music
    const next = new Howl({ src: [GAME_MUSIC_SOURCES[scene]], loop: true, preload: true, volume: 0 })
    this.music = next
    this.musicScene = scene
    next.play()
    next.fade(0, this.musicVolume * this.masterVolume, 700)
    if (previous !== null) {
      previous.fade(previous.volume(), 0, 500)
      previous.once('fade', () => { previous.stop(); previous.unload() })
    }
  }

  public stopMusic(): void {
    this.requestedMusicScene = null
    this.resumeMusicOnForeground = false
    if (this.music === null) return
    this.music.stop()
    this.music.unload()
    this.music = null
    this.musicScene = null
  }

  public setMuted(muted: boolean): void {
    this.muted = muted
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.muted)
    return this.muted
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(MAX_MASTER_VOLUME, volume))
    if (this.music !== null) this.music.volume(this.musicVolume * this.masterVolume)
  }

  public get isMuted(): boolean {
    return this.muted
  }

  public setMusicMuted(muted: boolean): void {
    this.musicMuted = muted
    if (muted) this.resumeMusicOnForeground = false
    if (this.music !== null) this.music.volume(muted ? 0 : this.musicVolume * this.masterVolume)
  }

  public toggleMusicMuted(): boolean {
    this.setMusicMuted(!this.musicMuted)
    return this.musicMuted
  }

  public get isMusicMuted(): boolean {
    return this.musicMuted
  }

  public get masterVolumeValue(): number {
    return this.masterVolume
  }

  private bindLifecycleListeners(): void {
    if (this.lifecycleBound || typeof document === 'undefined' || typeof window === 'undefined') return
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    window.addEventListener('blur', this.handleWindowBlur)
    window.addEventListener('focus', this.handleWindowFocus)
    window.addEventListener('pagehide', this.handlePageHide)
    window.addEventListener('pageshow', this.handlePageShow)
    this.lifecycleBound = true
  }

  private readonly handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') return
    if (document.hidden) {
      this.suspendForBackground()
    } else {
      this.resumeFromBackground()
    }
  }

  private readonly handleWindowBlur = (): void => {
    if (typeof document !== 'undefined' && document.hidden) return
    this.suspendForBackground()
  }

  private readonly handleWindowFocus = (): void => {
    if (typeof document !== 'undefined' && document.hidden) return
    this.resumeFromBackground()
  }

  private readonly handlePageHide = (): void => {
    this.suspendForBackground()
  }

  private readonly handlePageShow = (): void => {
    if (typeof document !== 'undefined' && document.hidden) return
    this.resumeFromBackground()
  }

  private suspendForBackground(): void {
    if (this.backgrounded) return
    this.backgrounded = true
    this.resumeMusicOnForeground = this.music !== null && this.music.playing() && !this.musicMuted
    this.music?.pause()
    for (const variants of this.sounds.values()) {
      for (const sound of variants) sound.stop()
    }
  }

  private resumeFromBackground(): void {
    if (!this.backgrounded) return
    this.backgrounded = false
    const shouldResume = this.resumeMusicOnForeground && !this.musicMuted
    this.resumeMusicOnForeground = false
    const requestedScene = this.requestedMusicScene
    if (requestedScene !== null && requestedScene !== this.musicScene) {
      this.playMusic(requestedScene)
      return
    }
    if (!shouldResume || !this.unlocked || this.music === null) return
    const context = Howler.ctx
    if (context?.state === 'suspended') void context.resume()
    this.music.play()
  }

  private getSounds(event: GameAudioEvent, definition: AudioDefinition): readonly Howl[] {
    const cached = this.sounds.get(event)
    if (cached !== undefined) return cached
    if (!canUseAudio()) return []
    const sounds = definition.sources.map((source) => new Howl({ src: [source], preload: true, volume: 0 }))
    this.sounds.set(event, sounds)
    return sounds
  }
}

export const gameAudio = new GameAudioController()
