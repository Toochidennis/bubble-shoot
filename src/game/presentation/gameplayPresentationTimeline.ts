import type { Point2D } from '../../types/foundation'
import type { HexGridConfig } from '../grid/gridConfig'
import { getCellCenter } from '../grid/coordinates'
import type { GridCoordinate } from '../grid/types'
import type { FloatingResolutionResult } from '../floating/types'
import type { ProjectileState, WallBounceEvent } from '../physics/types'
import type { TurnResult } from '../session/types'
import type { BubbleColor, BubbleDescriptor } from '../shooter/types'

export type PresentationParticleType = 'POP_SPARK' | 'POP_FRAGMENT' | 'BOUNCE_SPARK' | 'DROP_TRAIL' | 'STAR_SPARK'

export interface PresentationParticle {
  readonly id: number
  readonly type: PresentationParticleType
  readonly color: BubbleColor
  position: Point2D
  velocity: Point2D
  age: number
  readonly lifetime: number
  readonly scale: number
}

export interface PresentationTrailSample {
  readonly position: Point2D
  readonly color: BubbleColor
  age: number
}

export interface PresentationBubbleEffect {
  readonly key: string
  readonly position: Point2D
  readonly bubble: BubbleDescriptor
  readonly scale: number
  readonly alpha: number
}

export interface PresentationFallingBubble {
  readonly id: string
  readonly coordinate: GridCoordinate
  readonly bubble: BubbleDescriptor
  readonly position: Point2D
  readonly velocityY: number
  readonly driftX: number
  readonly age: number
}

export interface GameplayPresentationFrame {
  readonly time: number
  readonly entranceProgress: number
  readonly shooterScale: number
  readonly shooterGlow: number
  readonly trajectoryPhase: number
  readonly railPulse: number
  readonly trail: readonly PresentationTrailSample[]
  readonly particles: readonly PresentationParticle[]
  readonly bubbleEffects: readonly PresentationBubbleEffect[]
  readonly fallingBubbles: readonly PresentationFallingBubble[]
}

interface TimedEffect {
  readonly kind: 'recoil' | 'wall' | 'ceiling' | 'snap' | 'pop' | 'mission' | 'star'
  readonly startedAt: number
  readonly duration: number
  readonly position?: Point2D
  readonly key?: string
  readonly bubble?: BubbleDescriptor
  readonly color?: BubbleColor
  readonly strength?: number
}

interface MutableFallingBubble {
  readonly id: string
  readonly coordinate: GridCoordinate
  readonly bubble: BubbleDescriptor
  position: Point2D
  velocityY: number
  readonly driftX: number
  age: number
  readonly delay: number
}

const DEFAULT_MAX_PARTICLES = 320
const BOARD_ENTRANCE_DURATION = .52
const TRAIL_SAMPLE_LIMIT = 8

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function easeOut(value: number): number {
  const progress = clamp(value)
  return 1 - (1 - progress) ** 3
}

function hashSeed(...values: number[]): number {
  let hash = 2166136261
  for (const value of values) {
    hash ^= Math.round(value * 1000)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

function coordinateKey(coordinate: GridCoordinate): string {
  return `${coordinate.row}:${coordinate.column}`
}

function hexDistance(first: GridCoordinate, second: GridCoordinate): number {
  const firstX = first.column - Math.floor(first.row / 2)
  const secondX = second.column - Math.floor(second.row / 2)
  const firstZ = first.row
  const secondZ = second.row
  const firstY = -firstX - firstZ
  const secondY = -secondX - secondZ
  return Math.max(Math.abs(firstX - secondX), Math.abs(firstY - secondY), Math.abs(firstZ - secondZ))
}

export class GameplayPresentationTimeline {
  public readonly maxParticles: number
  private levelId = 1
  private currentTime = 0
  private entranceTime = BOARD_ENTRANCE_DURATION
  private paused = false
  private reducedMotion = false
  private viewportHeight = 900
  private nextParticleId = 1
  private readonly effects: TimedEffect[] = []
  private readonly particles: PresentationParticle[] = []
  private readonly trail: PresentationTrailSample[] = []
  private readonly falling: MutableFallingBubble[] = []
  private lastProjectilePosition: Point2D | null = null

  public constructor(maxParticles = DEFAULT_MAX_PARTICLES) {
    if (!Number.isSafeInteger(maxParticles) || maxParticles <= 0) throw new RangeError('Presentation particle capacity must be a positive integer.')
    this.maxParticles = maxParticles
  }

  public reset(levelId = 1, viewportHeight = 900): void {
    this.levelId = levelId
    this.viewportHeight = Math.max(1, viewportHeight)
    this.currentTime = 0
    this.entranceTime = 0
    this.paused = false
    this.effects.length = 0
    this.particles.length = 0
    this.trail.length = 0
    this.falling.length = 0
    this.lastProjectilePosition = null
  }

  public beginBoardEntrance(): void {
    this.entranceTime = 0
  }

  public setViewportHeight(height: number): void {
    if (Number.isFinite(height) && height > 0) this.viewportHeight = height
  }

  public setPaused(paused: boolean): void {
    this.paused = paused
  }

  public setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion
  }

  public get isPaused(): boolean {
    return this.paused
  }

  public get isInputBlocked(): boolean {
    return this.entranceTime < this.entranceDuration || this.effects.some((effect) => effect.kind === 'pop' || effect.kind === 'snap' || effect.kind === 'ceiling' || effect.kind === 'wall' && this.currentTime - effect.startedAt < .14)
  }

  public get hasActiveEffects(): boolean {
    return this.entranceTime < this.entranceDuration || this.effects.length > 0 || this.particles.length > 0 || this.trail.length > 0 || this.falling.length > 0
  }

  public emitAcceptedShot(origin: Point2D, bubble: BubbleDescriptor): void {
    this.lastProjectilePosition = origin
    this.trail.length = 0
    this.effects.push({ kind: 'recoil', startedAt: this.currentTime, duration: .26, position: origin, bubble, color: bubble.color })
  }

  public recordProjectile(projectile: ProjectileState): void {
    const previous = this.lastProjectilePosition
    if (previous === null || Math.hypot(projectile.position.x - previous.x, projectile.position.y - previous.y) > 2) {
      this.trail.unshift({ position: projectile.position, color: projectile.bubble.color, age: 0 })
      if (this.trail.length > TRAIL_SAMPLE_LIMIT) this.trail.length = TRAIL_SAMPLE_LIMIT
      this.lastProjectilePosition = projectile.position
    }
  }

  public emitWallBounce(event: WallBounceEvent, bubble: BubbleDescriptor): void {
    this.effects.push({ kind: 'wall', startedAt: this.currentTime, duration: .12, position: event.position, color: bubble.color, strength: .7 })
    for (let index = 0; index < (this.reducedMotion ? 1 : 3); index += 1) {
      const direction = event.wall === 'left' ? 1 : -1
      const angle = (hashSeed(this.levelId, index, event.position.x, event.position.y) - .5) * 1.2
      this.spawnParticle('BOUNCE_SPARK', bubble.color, event.position, { x: direction * (35 + index * 8), y: -35 + angle * 30 }, .16, .8)
    }
  }

  public emitTurn(turn: TurnResult, grid: HexGridConfig, floating: FloatingResolutionResult | null = turn.floating): void {
    this.trail.length = 0
    this.lastProjectilePosition = null
    if (turn.impact?.type === 'ceiling') this.effects.push({ kind: 'ceiling', startedAt: this.currentTime, duration: .24, position: turn.impact.position, color: turn.firedBubble.color, strength: .9 })
    if (turn.snap?.ok === true) {
      this.effects.push({ kind: 'snap', startedAt: this.currentTime, duration: .18, position: turn.snap.center, key: coordinateKey(turn.snap.coordinate), bubble: turn.snap.bubble })
    }
    const match = turn.match
    if (match?.ok === true && match.matched) {
      const origin = match.origin
      const removed = match.removedBubbles ?? []
      for (const removedBubble of removed) {
        const distance = hexDistance(origin, removedBubble.coordinate)
        const delay = .05 + distance * .016
        this.effects.push({
          kind: 'pop',
          startedAt: this.currentTime + delay,
          duration: .18,
          position: getCellCenter(grid, removedBubble.coordinate),
          key: coordinateKey(removedBubble.coordinate),
          bubble: removedBubble.bubble,
          color: removedBubble.bubble.color,
          strength: Math.min(1.4, .65 + match.clusterSize / 12),
        })
        const particleCount = match.clusterSize >= 10 ? 4 : 3
        for (let index = 0; index < particleCount; index += 1) {
          const angle = hashSeed(this.levelId, turn.turnNumber, removedBubble.coordinate.row, removedBubble.coordinate.column, index) * Math.PI * 2
          this.spawnParticle('POP_SPARK', removedBubble.bubble.color, getCellCenter(grid, removedBubble.coordinate), { x: Math.cos(angle) * (24 + index * 5), y: Math.sin(angle) * (24 + index * 5) }, .22 + (index % 2) * .04, .72)
        }
      }
      this.effects.push({ kind: 'mission', startedAt: this.currentTime, duration: .24, color: match.color, strength: Math.min(1.5, match.clusterSize / 4) })
    }
    if (floating?.removedAny) {
      for (const removed of floating.removedBubbles) {
        const index = this.falling.length
        this.falling.push({ id: `${turn.turnNumber}:${removed.coordinate.row}:${removed.coordinate.column}`, coordinate: removed.coordinate, bubble: removed.bubble, position: removed.center, velocityY: 42 + index * 5, driftX: this.reducedMotion ? 0 : (hashSeed(this.levelId, turn.turnNumber, removed.coordinate.row, removed.coordinate.column) - .5) * 22, age: 0, delay: .08 + Math.min(.08, index * .004) })
      }
      const firstFloating = floating.removedBubbles[0]
      if (firstFloating !== undefined) this.effects.push({ kind: 'ceiling', startedAt: this.currentTime, duration: .3, position: firstFloating.center, strength: Math.min(1.6, floating.removedCount / 12) })
      this.effects.push({ kind: 'mission', startedAt: this.currentTime, duration: .28, strength: Math.min(1.5, floating.removedCount / 10) })
    }
    if (turn.completed && turn.match?.ok === true && turn.match.matched === false) {
      if (turn.snap?.ok === true) this.effects.push({ kind: 'snap', startedAt: this.currentTime, duration: .18, position: turn.snap.center, strength: .5 })
    }
  }

  public emitStarFeedback(position: Point2D): void {
    this.effects.push({ kind: 'star', startedAt: this.currentTime, duration: .36, position, strength: 1 })
    for (let index = 0; index < 6; index += 1) {
      const angle = hashSeed(this.levelId, index, position.x, position.y) * Math.PI * 2
      this.spawnParticle('STAR_SPARK', 'yellow', position, { x: Math.cos(angle) * 30, y: Math.sin(angle) * 30 }, .35, .8)
    }
  }

  public advance(deltaSeconds: number): void {
    if (this.paused) return
    const delta = clamp(deltaSeconds, 0, .05)
    this.currentTime += delta
    this.entranceTime = Math.min(this.entranceDuration, this.entranceTime + delta)
    for (const sample of this.trail) sample.age += delta
    for (const particle of this.particles) {
      particle.age += delta
      particle.position = { x: particle.position.x + particle.velocity.x * delta, y: particle.position.y + particle.velocity.y * delta }
      particle.velocity = { x: particle.velocity.x * .97, y: particle.velocity.y * .97 + 45 * delta }
    }
    for (const bubble of this.falling) {
      bubble.age += delta
      if (bubble.age >= bubble.delay) {
        bubble.position = { x: bubble.position.x + bubble.driftX * delta, y: bubble.position.y + bubble.velocityY * delta }
        bubble.velocityY += 420 * delta
        if (!this.reducedMotion && bubble.age % .12 < delta) this.spawnParticle('DROP_TRAIL', bubble.bubble.color, bubble.position, { x: 0, y: 16 }, .24, .32)
      }
    }
    this.cleanup()
  }

  public frame(): GameplayPresentationFrame {
    const recoil = this.effects.find((effect) => effect.kind === 'recoil')
    const recoilProgress = recoil === undefined ? 0 : clamp((this.currentTime - recoil.startedAt) / recoil.duration)
    const activeEffects = this.effects.filter((effect) => effect.startedAt <= this.currentTime)
    const bubbleEffects: PresentationBubbleEffect[] = []
    for (const effect of activeEffects) {
      if (effect.kind === 'pop' && effect.position !== undefined && effect.bubble !== undefined && effect.key !== undefined) {
        const progress = clamp((this.currentTime - effect.startedAt) / effect.duration)
        bubbleEffects.push({ key: effect.key, position: effect.position, bubble: effect.bubble, scale: 1.02 + Math.sin(progress * Math.PI) * .07, alpha: 1 - easeOut(progress) })
      }
    }
    return {
      time: this.currentTime,
      entranceProgress: clamp(this.entranceTime / this.entranceDuration),
      shooterScale: 1 - Math.sin(recoilProgress * Math.PI) * .06,
      shooterGlow: .25 + Math.sin(this.currentTime * 1.5) * .05 + (recoil === undefined ? 0 : Math.sin(recoilProgress * Math.PI) * .18),
      trajectoryPhase: this.reducedMotion ? 0 : this.currentTime,
      railPulse: activeEffects.reduce((value, effect) => effect.kind === 'ceiling' ? Math.max(value, 1 - clamp((this.currentTime - effect.startedAt) / effect.duration)) : value, 0),
      trail: this.trail.map((sample) => ({ ...sample })),
      particles: this.particles.map((particle) => ({ ...particle, position: { ...particle.position }, velocity: { ...particle.velocity } })),
      bubbleEffects,
      fallingBubbles: this.falling.filter((bubble) => bubble.age >= bubble.delay).map((bubble) => ({ id: bubble.id, coordinate: bubble.coordinate, bubble: bubble.bubble, position: { ...bubble.position }, velocityY: bubble.velocityY, driftX: bubble.driftX, age: bubble.age })),
    }
  }

  private spawnParticle(type: PresentationParticleType, color: BubbleColor, position: Point2D, velocity: Point2D, lifetime: number, scale: number): void {
    if (this.reducedMotion && type !== 'STAR_SPARK' && type !== 'POP_SPARK') return
    if (this.particles.length >= this.maxParticles) this.particles.shift()
    this.particles.push({ id: this.nextParticleId++, type, color, position: { ...position }, velocity: { ...velocity }, age: 0, lifetime, scale })
  }

  private get entranceDuration(): number {
    return this.reducedMotion ? .18 : BOARD_ENTRANCE_DURATION
  }

  private cleanup(): void {
    for (let index = this.effects.length - 1; index >= 0; index -= 1) {
      const effect = this.effects[index]
      if (effect === undefined) continue
      if (effect.startedAt + effect.duration < this.currentTime && effect.kind !== 'recoil') this.effects.splice(index, 1)
    }
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index]
      if (particle !== undefined && particle.age >= particle.lifetime) this.particles.splice(index, 1)
    }
    for (let index = this.trail.length - 1; index >= 0; index -= 1) {
      const sample = this.trail[index]
      if (sample !== undefined && sample.age > .22) this.trail.splice(index, 1)
    }
    for (let index = this.falling.length - 1; index >= 0; index -= 1) {
      const bubble = this.falling[index]
      if (bubble !== undefined && bubble.position.y > this.viewportHeight + 48) this.falling.splice(index, 1)
    }
  }
}

export const PRESENTATION_LIMITS = Object.freeze({
  maxParticles: DEFAULT_MAX_PARTICLES,
  maxTrailSamples: TRAIL_SAMPLE_LIMIT,
  boardEntranceDuration: BOARD_ENTRANCE_DURATION,
})
