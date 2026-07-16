import { gsap } from 'gsap'
import { Application, Container, Graphics } from 'pixi.js'

import { getCellCenter } from '../grid/coordinates'
import type { HexGridConfig } from '../grid/gridConfig'
import type { TurnResult } from '../session/types'
import type { BubbleColor } from '../shooter/types'

const BUBBLE_COLORS: Record<BubbleColor, { readonly base: number; readonly light: number }> = {
  blue: { base: 0x2369c8, light: 0x7fc4ff },
  green: { base: 0x16834f, light: 0x77f0ad },
  purple: { base: 0x6a35b9, light: 0xd4a2ff },
  red: { base: 0xc5334f, light: 0xffa1b0 },
  yellow: { base: 0xd09214, light: 0xffef9b },
}

const MAX_MATCH_BUBBLES = 32
const SHARDS_PER_BUBBLE = 6

interface MatchEffectGroup {
  readonly container: Container
  readonly timeline: ReturnType<typeof gsap.timeline>
}

function seededUnit(...values: number[]): number {
  let hash = 2166136261
  for (const value of values) {
    hash ^= Math.round(value * 1000)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

function drawDiamond(size: number, color: number, alpha: number): Graphics {
  return new Graphics()
    .moveTo(0, -size)
    .lineTo(size * 0.68, 0)
    .lineTo(0, size)
    .lineTo(-size * 0.68, 0)
    .closePath()
    .fill({ color, alpha })
}

function drawRing(radius: number, color: number, width: number, alpha: number): Graphics {
  return new Graphics()
    .circle(0, 0, radius)
    .stroke({ width, color, alpha })
}

/**
 * PixiJS is deliberately restricted to transient match effects. The
 * authoritative board, physics, and Canvas renderer remain untouched.
 */
export class MatchEffectsOverlay {
  private app: Application | null = null
  private readonly groups: MatchEffectGroup[] = []
  private reducedMotion = false
  private disposed = false

  public async mount(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    if (this.app !== null) return

    this.disposed = false
    const app = new Application()
    try {
      await app.init({
        canvas,
        width: Math.max(1, width),
        height: Math.max(1, height),
        autoStart: false,
        antialias: true,
        backgroundAlpha: 0,
        preference: 'canvas',
        resolution: 1,
        autoDensity: true,
      })
      if (this.disposed) {
        app.destroy()
        return
      }
      this.app = app
      app.renderer.background.alpha = 0
      app.stage.eventMode = 'none'
      app.render()
    } catch {
      app.destroy()
    }
  }

  public get isReady(): boolean {
    return this.app !== null
  }

  public get hasActiveEffects(): boolean {
    return this.groups.length > 0
  }

  public setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion
  }

  public setPaused(paused: boolean): void {
    for (const group of this.groups) {
      if (paused) group.timeline.pause()
      else group.timeline.resume()
    }
  }

  public resize(width: number, height: number): void {
    this.app?.renderer.resize(Math.max(1, width), Math.max(1, height))
    this.render()
  }

  public render(): void {
    this.app?.render()
  }

  public clear(): void {
    for (const group of this.groups.splice(0)) {
      group.timeline.kill()
      group.container.destroy({ children: true })
    }
    if (this.app !== null) {
      this.app.stage.removeChildren()
      this.render()
    }
  }

  public emitTurn(turn: TurnResult, grid: HexGridConfig, levelId: number): void {
    const match = turn.match
    if (this.app === null || match?.ok !== true || !match.matched) return

    const removed = (match.removedBubbles ?? match.cluster.map((coordinate) => ({ coordinate, bubble: match.bubble }))).slice(0, MAX_MATCH_BUBBLES)
    if (removed.length === 0) return

    const origin = getCellCenter(grid, match.origin)
    const color = BUBBLE_COLORS[match.color]
    const variant = Math.abs(levelId + turn.turnNumber + match.origin.row + match.origin.column) % 3
    const radius = grid.bubbleRadius
    const root = new Container()
    root.position.set(0, 0)
    root.alpha = 0
    this.app.stage.addChild(root)

    const core = new Graphics().circle(origin.x, origin.y, radius * 0.48).fill({ color: color.light, alpha: 0.95 })
    const coreGlow = new Graphics().circle(origin.x, origin.y, radius * 1.8).fill({ color: color.light, alpha: 0.12 })
    const ringOne = drawRing(radius * 1.35, color.light, Math.max(1.5, radius * 0.14), 0.86)
    const ringTwo = drawRing(radius * 1.7, color.base, Math.max(1, radius * 0.09), 0.56)
    const ringThree = drawRing(radius * 2.3, color.light, Math.max(1, radius * 0.06), 0.3)
    ringOne.position.set(origin.x, origin.y)
    ringTwo.position.set(origin.x, origin.y)
    ringThree.position.set(origin.x, origin.y)
    root.addChild(coreGlow, ringThree, ringTwo, ringOne, core)
    core.alpha = 0
    coreGlow.alpha = 0

    const rays = new Graphics()
    const rayCount = variant === 1 ? 14 : 10
    for (let index = 0; index < rayCount; index += 1) {
      const angle = (index / rayCount) * Math.PI * 2 + seededUnit(levelId, turn.turnNumber, index) * 0.24
      const length = radius * (2.2 + seededUnit(turn.turnNumber, index) * 1.5)
      rays.moveTo(origin.x + Math.cos(angle) * radius * 0.6, origin.y + Math.sin(angle) * radius * 0.6)
      rays.lineTo(origin.x + Math.cos(angle) * length, origin.y + Math.sin(angle) * length)
    }
    rays.stroke({ width: Math.max(1, radius * 0.07), color: color.light, alpha: 0.28 })
    rays.alpha = 0
    root.addChild(rays)

    const ordered = [...removed].sort((first, second) => {
      const firstPosition = getCellCenter(grid, first.coordinate)
      const secondPosition = getCellCenter(grid, second.coordinate)
      const firstDistance = Math.hypot(firstPosition.x - origin.x, firstPosition.y - origin.y)
      const secondDistance = Math.hypot(secondPosition.x - origin.x, secondPosition.y - origin.y)
      return variant === 1 ? secondDistance - firstDistance : firstDistance - secondDistance
    })

    const timeline = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onUpdate: () => this.render(),
      onComplete: () => {
        const index = this.groups.findIndex((group) => group.container === root)
        if (index >= 0) this.groups.splice(index, 1)
        root.destroy({ children: true })
        this.render()
      },
    })

    timeline.to(root, { alpha: 1, duration: this.reducedMotion ? 0.04 : 0.08, ease: 'power2.out' })
    timeline.to(coreGlow, { alpha: 1, duration: 0.12, ease: 'power2.out' }, 0)
    timeline.to(core.scale, { x: 1.35, y: 1.35, duration: 0.2, ease: 'back.out(2.4)' }, 0.02)
    timeline.to(rays, { alpha: 1, duration: 0.08, ease: 'power2.out' }, 0.08)
    timeline.to(ringOne.scale, { x: 1.8, y: 1.8, duration: 0.34, ease: 'power2.out' }, 0.12)
    timeline.to(ringTwo.scale, { x: 1.7, y: 1.7, duration: 0.42, ease: 'power2.out' }, 0.17)
    timeline.to(ringThree.scale, { x: 2.25, y: 2.25, duration: 0.54, ease: 'power2.out' }, 0.22)
    timeline.to(core, { alpha: 0, duration: 0.16, ease: 'power2.in' }, 0.24)
    timeline.to(coreGlow, { alpha: 0, duration: 0.26, ease: 'power2.in' }, 0.3)
    timeline.to(rays, { alpha: 0, duration: 0.3, ease: 'power2.out' }, 0.38)

    ordered.forEach((removedBubble, index) => {
      const position = getCellCenter(grid, removedBubble.coordinate)
      const bubbleContainer = new Container()
      bubbleContainer.position.set(position.x, position.y)
      const bubble = new Graphics().circle(0, 0, radius * 0.98).fill({ color: color.base, alpha: 0.92 }).stroke({ width: Math.max(1, radius * 0.09), color: color.light, alpha: 0.72 })
      const highlight = new Graphics().circle(-radius * 0.27, -radius * 0.3, radius * 0.16).fill({ color: 0xffffff, alpha: 0.55 })
      bubbleContainer.addChild(bubble, highlight)

      const shardCount = this.reducedMotion ? 2 : SHARDS_PER_BUBBLE
      for (let shardIndex = 0; shardIndex < shardCount; shardIndex += 1) {
        const angle = seededUnit(levelId, turn.turnNumber, removedBubble.coordinate.row, removedBubble.coordinate.column, shardIndex) * Math.PI * 2
        const distance = radius * (1.5 + seededUnit(shardIndex, index, turn.turnNumber) * 2.4)
        const shard = drawDiamond(radius * (0.11 + seededUnit(index, shardIndex) * 0.1), shardIndex % 2 === 0 ? color.light : color.base, 0.9)
        shard.position.set(0, 0)
        shard.alpha = 0
        bubbleContainer.addChild(shard)
        timeline.to(shard, { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, alpha: 0.9, rotation: seededUnit(index, shardIndex) * 4, duration: 0.22, ease: 'power2.out' }, 0.2 + index * 0.045)
        timeline.to(shard, { alpha: 0, scale: 0.1, duration: 0.18, ease: 'power2.in' }, 0.38 + index * 0.045)
      }

      bubbleContainer.scale.set(0.96)
      root.addChild(bubbleContainer)
      const start = 0.1 + index * (this.reducedMotion ? 0.015 : 0.045)
      timeline.to(bubbleContainer.scale, { x: 1.13, y: 1.13, duration: this.reducedMotion ? 0.03 : 0.08, ease: 'back.out(2)' }, start)
      timeline.to(bubbleContainer.scale, { x: 0.05, y: 0.05, duration: this.reducedMotion ? 0.08 : 0.2, ease: 'power3.in' }, start + (this.reducedMotion ? 0.03 : 0.08))
      timeline.to(bubbleContainer, { alpha: 0, duration: this.reducedMotion ? 0.05 : 0.18, ease: 'power2.in' }, start + (this.reducedMotion ? 0.05 : 0.12))
    })

    const group = { container: root, timeline }
    this.groups.push(group)
    if (this.reducedMotion) timeline.timeScale(1.8)
    this.render()
  }

  public dispose(): void {
    this.disposed = true
    this.clear()
    this.app?.destroy()
    this.app = null
  }
}
