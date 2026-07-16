import type { CanvasMetrics } from './canvasMetrics'
import type { Point2D } from '../../types/foundation'
import type { HexBoard } from '../grid/HexBoard'
import type { ProjectileState } from '../physics/types'
import type { FallingBubbleVisual } from '../floating/types'
import type { BubbleColor, BubbleDescriptor, ShooterStateSnapshot } from '../shooter/types'
import type { TrajectoryPreview } from '../shooter/trajectory'
import { getBubbleVisualVariant, type BubbleVisualTheme } from './bubbleVisualTheme'
import type { GameplayPresentationFrame } from '../presentation/gameplayPresentationTimeline'

export const BUBBLE_COLOR_STOPS: Readonly<Record<BubbleColor, { readonly base: string; readonly light: string; readonly dark: string; readonly glow: string }>> = Object.freeze({
  blue: { base: '#1456ad', light: '#4b96e4', dark: '#062d69', glow: '#1f5fb6' },
  green: { base: '#16814c', light: '#5cbd83', dark: '#073f29', glow: '#1a8652' },
  purple: { base: '#6735ad', light: '#a273dc', dark: '#321866', glow: '#7440b9' },
  red: { base: '#b42f48', light: '#e26a78', dark: '#5e1429', glow: '#bd3851' },
  yellow: { base: '#c68d20', light: '#edc15b', dark: '#67450d', glow: '#c99428' },
})

export interface GameplayRenderOptions {
  readonly showTrajectory?: boolean
  readonly visualTheme?: BubbleVisualTheme
  /** Presentation-only hold for a terminal shot that could not be snapped. */
  readonly terminalProjectile?: ProjectileState | null
  readonly presentation?: GameplayPresentationFrame
}

export interface GameplayTrajectoryDot {
  readonly position: Point2D
  readonly radius: number
  readonly alpha: number
  readonly color: string
}

export const TRAJECTORY_DOT_SPACING = 30
export const MAX_TRAJECTORY_DOTS = 40

export interface GameplayCeilingRailModel {
  readonly y: number
  readonly inset: number
  readonly accentXs: readonly number[]
}

export function getGameplayCeilingRailModel(width: number, boardCeilingY: number): GameplayCeilingRailModel {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(boardCeilingY)) {
    throw new RangeError('Gameplay ceiling rail dimensions must be finite and positive.')
  }
  const inset = Math.min(8, width / 4)
  return { y: boardCeilingY, inset, accentXs: [inset, width / 2, Math.max(inset, width - inset)] }
}

export function getGameplayTrajectoryDots(
  trajectory: TrajectoryPreview,
  color: BubbleColor,
): readonly GameplayTrajectoryDot[] {
  const dots: GameplayTrajectoryDot[] = []
  let distance = 0
  for (const segment of trajectory.segments) {
    const dx = segment.end.x - segment.start.x
    const dy = segment.end.y - segment.start.y
    const length = Math.hypot(dx, dy)
    const steps = Math.max(1, Math.floor(length / TRAJECTORY_DOT_SPACING))
    for (let index = 1; index <= steps; index += 1) {
      if (dots.length >= MAX_TRAJECTORY_DOTS) return dots
      const progress = index / steps
      const dotDistance = distance + length * progress
      dots.push({
        position: {
          x: segment.start.x + dx * progress,
          y: segment.start.y + dy * progress,
        },
        radius: Math.max(2.1, 4.2 - dotDistance / 320),
        alpha: Math.max(.28, 1 - dotDistance / 760),
      color: BUBBLE_COLOR_STOPS[color].light,
      })
      distance = dotDistance
    }
  }
  return dots
}

export function drawGameplayFrame(
  context: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
  board: HexBoard<BubbleDescriptor>,
  boardCeilingY: number,
  snapshot: ShooterStateSnapshot,
  trajectory: TrajectoryPreview,
  projectile: ProjectileState | null,
  fallingBubbles: readonly FallingBubbleVisual[],
  options: GameplayRenderOptions = {},
): void {
  const width = metrics.logicalWidth
  const height = metrics.logicalHeight
  const visualTheme = options.visualTheme ?? 'CLASSIC_GLOSS'
  context.clearRect(0, 0, width, height)
  const background = context.createLinearGradient(0, 0, width * .7, height)
  background.addColorStop(0, '#050739')
  background.addColorStop(.52, '#090b4d')
  background.addColorStop(1, '#10052f')
  context.fillStyle = background
  context.fillRect(0, 0, width, height)
  drawAmbient(context, width, height)
  drawCeilingRail(context, width, boardCeilingY, options.presentation?.railPulse ?? 0)

  drawPresentationTrail(context, options.presentation?.trail ?? [])
  if (options.presentation?.matchPulse !== null && options.presentation?.matchPulse !== undefined) drawMatchPulse(context, options.presentation.matchPulse)

  for (const cell of board.getOccupiedCells()) if (cell.value !== undefined) {
    const key = `${cell.coordinate.row}:${cell.coordinate.column}`
    const effect = options.presentation?.bubbleEffects.find((candidate) => candidate.key === key)
    const entrance = options.presentation?.entranceProgress ?? 1
    const entranceAlpha = Math.min(1, Math.max(0, (entrance - cell.coordinate.row * .025) / .32))
    const entranceOffset = (1 - entranceAlpha) * -6
    drawBubble(context, cell.center.x, cell.center.y + entranceOffset, board.config.bubbleRadius * (effect?.scale ?? (0.96 + entranceAlpha * .04)), cell.value, visualTheme, 'board', entranceAlpha * (effect?.alpha ?? 1), cell.coordinate)
  }
  for (const effect of options.presentation?.bubbleEffects ?? []) {
    drawBubble(context, effect.position.x, effect.position.y, board.config.bubbleRadius * effect.scale, effect.bubble, visualTheme, 'projectile', effect.alpha, { row: -4, column: effect.key.length })
    drawBubblePopAccent(context, effect, board.config.bubbleRadius)
  }
  for (const falling of fallingBubbles) {
    drawBubble(context, falling.position.x, falling.position.y, board.config.bubbleRadius * .82, falling.bubble, visualTheme, 'falling', .76, falling.coordinate)
  }
  for (const falling of options.presentation?.fallingBubbles ?? []) {
    context.save()
    context.translate(falling.position.x, falling.position.y)
    context.rotate(falling.rotation)
    drawBubble(context, 0, 0, board.config.bubbleRadius * falling.scale, falling.bubble, visualTheme, 'falling', falling.alpha, falling.coordinate)
    context.restore()
  }

  drawPresentationParticles(context, options.presentation?.particles ?? [])
  if (options.presentation?.wallBounce !== null && options.presentation?.wallBounce !== undefined) drawWallBounceAccent(context, options.presentation.wallBounce, board.config.bubbleRadius)

  if (options.showTrajectory !== false && projectile === null) drawTrajectory(context, trajectory, snapshot.currentBubble.color, options.presentation?.trajectoryPhase ?? 0)
  if (projectile !== null) {
    drawProjectileWithMotion(context, projectile, visualTheme, options.presentation?.wallBounce ?? null)
  } else if (options.terminalProjectile !== null && options.terminalProjectile !== undefined) {
    drawBubble(context, options.terminalProjectile.position.x, options.terminalProjectile.position.y, options.terminalProjectile.radius, options.terminalProjectile.bubble, visualTheme, 'projectile', 1, { row: -2, column: options.terminalProjectile.id.length })
  }
  drawShooter(context, snapshot.origin.x, snapshot.origin.y, board.config.bubbleRadius, snapshot.currentBubble, snapshot.aimDirection, visualTheme, options.presentation)
}

function drawProjectileWithMotion(
  context: CanvasRenderingContext2D,
  projectile: ProjectileState,
  visualTheme: BubbleVisualTheme,
  wallBounce: NonNullable<GameplayPresentationFrame['wallBounce']> | null,
): void {
  if (wallBounce === null) {
    drawBubble(context, projectile.position.x, projectile.position.y, projectile.radius, projectile.bubble, visualTheme, 'projectile', 1, { row: -2, column: projectile.id.length })
    return
  }
  const progress = Math.min(1, Math.max(0, wallBounce.progress))
  const impactPhase = Math.min(1, progress / .24)
  const reboundPhase = Math.max(0, (progress - .12) / .88)
  const rebound = Math.sin(reboundPhase * Math.PI)
  const alongScale = 1 - .06 * (1 - impactPhase) + .08 * rebound
  const perpendicularScale = 1 + .045 * (1 - impactPhase) - .055 * rebound
  const angle = Math.atan2(projectile.direction.y, projectile.direction.x)
  context.save()
  context.translate(projectile.position.x, projectile.position.y)
  context.rotate(angle)
  context.scale(alongScale, perpendicularScale)
  drawBubble(context, 0, 0, projectile.radius, projectile.bubble, visualTheme, 'projectile', 1, { row: -2, column: projectile.id.length })
  context.restore()
}

function drawCeilingRail(context: CanvasRenderingContext2D, width: number, boardCeilingY: number, pulse = 0): void {
  const rail = getGameplayCeilingRailModel(width, boardCeilingY)
  context.save()
  context.lineCap = 'round'
  context.setLineDash([18, 10])
  context.shadowColor = 'rgba(166, 133, 255, .58)'
  context.shadowBlur = 10
  context.strokeStyle = `rgba(229, 222, 255, ${.86 + pulse * .14})`
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(rail.inset, rail.y)
  context.lineTo(Math.max(rail.inset, width - rail.inset), rail.y)
  context.stroke()
  if (pulse > 0) {
    context.shadowColor = 'rgba(255, 244, 190, .9)'
    context.shadowBlur = 12 + pulse * 10
    context.strokeStyle = `rgba(255, 232, 154, ${pulse * .55})`
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(rail.inset, rail.y)
    context.lineTo(Math.max(rail.inset, width - rail.inset), rail.y)
    context.stroke()
  }
  context.setLineDash([])
  context.shadowBlur = 0
  context.strokeStyle = 'rgba(138, 108, 235, .55)'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(rail.inset, rail.y + 4)
  context.lineTo(Math.max(rail.inset, width - rail.inset), rail.y + 4)
  context.stroke()
  for (const x of rail.accentXs) {
    context.fillStyle = '#f3edff'
    context.beginPath()
    context.arc(x, rail.y, x === width / 2 ? 3 : 2, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function drawAmbient(context: CanvasRenderingContext2D, width: number, height: number): void {
  const glows = [
    { x: width * .12, y: height * .34, radius: width * .5, color: 'rgba(49, 76, 255, .22)' },
    { x: width * .88, y: height * .7, radius: width * .48, color: 'rgba(201, 38, 255, .16)' },
    { x: width * .5, y: height * .92, radius: width * .4, color: 'rgba(126, 58, 255, .2)' },
  ]
  for (const glow of glows) {
    const gradient = context.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius)
    gradient.addColorStop(0, glow.color)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)
  }
  context.save()
  context.globalAlpha = .55
  context.fillStyle = '#bca6ff'
  for (let index = 0; index < 36; index += 1) {
    const x = ((index * 71) % Math.max(1, width - 8)) + 4
    const y = ((index * 113) % Math.max(1, height - 8)) + 4
    context.fillRect(x, y, index % 5 === 0 ? 1.6 : 1, index % 5 === 0 ? 1.6 : 1)
  }
  context.restore()
}

function drawTrajectory(context: CanvasRenderingContext2D, trajectory: TrajectoryPreview, color: BubbleColor, phase = 0): void {
  context.save()
  for (const [index, dot] of getGameplayTrajectoryDots(trajectory, color).entries()) {
      context.fillStyle = dot.color
      const shimmer = .86 + .14 * Math.sin(phase * 2.1 - index * .42)
      context.globalAlpha = dot.alpha * shimmer
      context.beginPath()
      context.arc(dot.position.x, dot.position.y, dot.radius, 0, Math.PI * 2)
      context.fill()
  }
  context.restore()
}

function drawMatchPulse(context: CanvasRenderingContext2D, pulse: NonNullable<GameplayPresentationFrame['matchPulse']>): void {
  const colors = BUBBLE_COLOR_STOPS[pulse.color]
  const progress = Math.min(1, Math.max(0, pulse.progress))
  const radius = 12 + progress * 32 * pulse.strength
  const alpha = (1 - progress) * .34 * pulse.strength
  context.save()
  context.globalAlpha = alpha
  context.strokeStyle = colors.light
  context.shadowColor = colors.glow
  context.shadowBlur = 12
  context.lineWidth = Math.max(1.5, 3.5 * (1 - progress))
  context.beginPath()
  context.arc(pulse.position.x, pulse.position.y, radius, 0, Math.PI * 2)
  context.stroke()
  context.restore()
}

function drawBubblePopAccent(context: CanvasRenderingContext2D, effect: NonNullable<GameplayPresentationFrame['bubbleEffects']>[number], radius: number): void {
  const colors = BUBBLE_COLOR_STOPS[effect.bubble.color]
  context.save()
  if (effect.flashAlpha > 0) {
    const flashRadius = radius * 1.8
    const flash = context.createRadialGradient(effect.position.x, effect.position.y, 0, effect.position.x, effect.position.y, flashRadius)
    flash.addColorStop(0, `rgba(255,255,255,${effect.flashAlpha})`)
    flash.addColorStop(.42, `${colors.light}${Math.round(effect.flashAlpha * 255).toString(16).padStart(2, '0')}`)
    flash.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = flash
    context.beginPath()
    context.arc(effect.position.x, effect.position.y, flashRadius, 0, Math.PI * 2)
    context.fill()
  }
  if (effect.ringAlpha > 0) {
    context.globalAlpha = effect.ringAlpha
    context.strokeStyle = colors.light
    context.shadowColor = colors.glow
    context.shadowBlur = 9
    context.lineWidth = 2
    context.beginPath()
    context.arc(effect.position.x, effect.position.y, radius * 1.08 * effect.ringScale, 0, Math.PI * 2)
    context.stroke()
  }
  context.restore()
}

function drawPresentationTrail(context: CanvasRenderingContext2D, trail: readonly { readonly position: Point2D; readonly color: BubbleColor; readonly age: number }[]): void {
  context.save()
  for (const [index, sample] of trail.entries()) {
    const alpha = Math.max(0, .42 * (1 - sample.age / .22) * (1 - index / Math.max(1, trail.length)))
    context.globalAlpha = alpha
    context.fillStyle = BUBBLE_COLOR_STOPS[sample.color].light
    context.beginPath()
    context.arc(sample.position.x, sample.position.y, Math.max(1.5, 3.2 - index * .25), 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function drawWallBounceAccent(
  context: CanvasRenderingContext2D,
  bounce: NonNullable<GameplayPresentationFrame['wallBounce']>,
  radius: number,
): void {
  const colors = BUBBLE_COLOR_STOPS[bounce.color]
  const progress = Math.min(1, Math.max(0, bounce.progress))
  const alpha = (1 - progress) * .7 * bounce.strength
  const ringRadius = radius * (.72 + progress * 1.1)
  context.save()
  context.globalAlpha = alpha
  context.strokeStyle = colors.light
  context.shadowColor = colors.glow
  context.shadowBlur = 10
  context.lineWidth = Math.max(1.2, radius * .1 * (1 - progress))
  context.beginPath()
  context.arc(bounce.position.x, bounce.position.y, ringRadius, 0, Math.PI * 2)
  context.stroke()
  context.shadowBlur = 0
  context.strokeStyle = '#f5edff'
  context.lineWidth = Math.max(1, radius * .06)
  context.beginPath()
  context.moveTo(bounce.position.x, bounce.position.y - radius * .7)
  context.lineTo(bounce.position.x, bounce.position.y + radius * .7)
  context.stroke()
  context.restore()
}

function drawPresentationParticles(context: CanvasRenderingContext2D, particles: readonly { readonly type: string; readonly color: BubbleColor; readonly position: Point2D; readonly velocity: Point2D; readonly age: number; readonly lifetime: number; readonly scale: number; readonly rotation: number }[]): void {
  context.save()
  for (const particle of particles) {
    const life = Math.max(0, 1 - particle.age / particle.lifetime)
    const colors = BUBBLE_COLOR_STOPS[particle.color]
    context.globalAlpha = life * (particle.type === 'DROP_TRAIL' ? .28 : particle.type === 'POP_FRAGMENT' ? .82 : .72)
    context.fillStyle = particle.type === 'POP_FRAGMENT' ? colors.base : colors.light
    context.strokeStyle = colors.light
    if (particle.type === 'POP_SPARK' || particle.type === 'BOUNCE_SPARK') {
      const length = Math.max(3, particle.scale * 8 * life)
      const directionLength = Math.max(.001, Math.hypot(particle.velocity.x, particle.velocity.y))
      const dx = particle.velocity.x / directionLength * length
      const dy = particle.velocity.y / directionLength * length
      context.lineWidth = Math.max(1, particle.scale * 1.8 * life)
      context.lineCap = 'round'
      context.beginPath()
      context.moveTo(particle.position.x - dx * .35, particle.position.y - dy * .35)
      context.lineTo(particle.position.x + dx, particle.position.y + dy)
      context.stroke()
    } else if (particle.type === 'POP_FRAGMENT') {
      const size = Math.max(1.5, particle.scale * 4.2 * life)
      context.save()
      context.translate(particle.position.x, particle.position.y)
      context.rotate(particle.rotation)
      context.beginPath()
      context.moveTo(0, -size)
      context.lineTo(size * .62, 0)
      context.lineTo(0, size)
      context.lineTo(-size * .62, 0)
      context.closePath()
      context.fill()
      context.restore()
    } else {
      context.beginPath()
      context.arc(particle.position.x, particle.position.y, Math.max(1, particle.scale * 2.2 * life), 0, Math.PI * 2)
      context.fill()
    }
  }
  context.restore()
}

export type BubblePresentationState = 'board' | 'falling' | 'projectile' | 'shooter' | 'next'

export function drawBubble(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  bubble: BubbleDescriptor,
  visualTheme: BubbleVisualTheme = 'CLASSIC_GLOSS',
  presentationState: BubblePresentationState = 'board',
  alpha = 1,
  variationSeed: { readonly row: number; readonly column: number } = { row: 0, column: 0 },
): void {
  const colors = BUBBLE_COLOR_STOPS[bubble.color]
  const variant = getBubbleVisualVariant(variationSeed.row, variationSeed.column, bubble.color)
  // Level families remain metadata; the visible gameplay silhouette is always
  // the same smooth sphere.
  void visualTheme
  const gradient = context.createRadialGradient(x + radius * variant.highlightX, y + radius * variant.highlightY, radius * .06, x, y, radius * 1.14)
  gradient.addColorStop(0, colors.light)
  gradient.addColorStop(.12, colors.base)
  gradient.addColorStop(.8, colors.base)
  gradient.addColorStop(1, colors.dark)
  context.save()
  context.globalAlpha = alpha
  context.shadowColor = colors.glow
  context.shadowBlur = radius * (presentationState === 'board' ? .2 : .4)
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fillStyle = gradient
  context.fill()
  context.shadowBlur = 0
  context.globalAlpha = alpha * .72
  context.strokeStyle = colors.dark
  context.lineWidth = Math.max(1, radius * (presentationState === 'shooter' ? .075 : .055))
  context.stroke()

  // A restrained lower contact rim keeps close-packed cells visually connected.
  context.globalAlpha = alpha * .12
  context.strokeStyle = colors.dark
  context.lineWidth = Math.max(1, radius * .085)
  context.beginPath()
  context.arc(x, y, radius * .86, .18, Math.PI - .18)
  context.stroke()

  context.globalAlpha = alpha * .28
  context.fillStyle = colors.light
  context.beginPath()
  context.ellipse(x + radius * variant.highlightX, y + radius * variant.highlightY, radius * .18, radius * .075, -.45, 0, Math.PI * 2)
  context.fill()

  if (bubble.marked === true) {
    // The target marker sits outside the sphere and never creates a hole in
    // the pure BubbleColor body.
    context.globalAlpha = alpha * .92
    context.beginPath()
    context.arc(x, y, radius * 1.08, 0, Math.PI * 2)
    context.strokeStyle = '#fff5a3'
    context.lineWidth = Math.max(1.3, radius * .09)
    context.stroke()
  }
  context.restore()
}

function drawShooter(context: CanvasRenderingContext2D, x: number, y: number, radius: number, bubble: BubbleDescriptor, aimDirection: Point2D, visualTheme: BubbleVisualTheme, presentation?: GameplayPresentationFrame): void {
  const colors = BUBBLE_COLOR_STOPS[bubble.color]
  context.save()
  const aura = context.createRadialGradient(x, y + radius * .35, 0, x, y + radius * .35, radius * 2.2)
  aura.addColorStop(0, `rgba(187, 63, 255, ${.35 + (presentation?.shooterGlow ?? .25)})`)
  aura.addColorStop(1, 'rgba(187, 63, 255, 0)')
  context.fillStyle = aura
  context.fillRect(x - radius * 2.3, y - radius * 1.5, radius * 4.6, radius * 3)
  context.beginPath()
  context.ellipse(x, y + radius * .64, radius * 1.1, radius * .3, 0, 0, Math.PI * 2)
  context.fillStyle = 'rgba(65, 35, 146, .78)'
  context.fill()
  context.beginPath()
  context.arc(x, y, radius * 1.28, Math.PI, Math.PI * 2)
  context.strokeStyle = '#dca7ff'
  context.lineWidth = radius * .12
  context.stroke()
  drawBubble(context, x, y, radius * (presentation?.shooterScale ?? 1), bubble, visualTheme, 'shooter', 1, { row: -3, column: 0 })
  drawAimPointer(context, x, y, radius, aimDirection, colors.light, colors.glow)
  context.restore()
}

function drawAimPointer(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  direction: Point2D,
  color: string,
  glow: string,
): void {
  const start = radius * 1.18
  const end = radius * 3.15
  const tip = { x: x + direction.x * end, y: y + direction.y * end }
  const shaftStart = { x: x + direction.x * start, y: y + direction.y * start }
  const normal = { x: -direction.y, y: direction.x }
  const headLength = radius * .54
  const headWidth = radius * .34
  context.save()
  context.lineCap = 'round'
  context.shadowColor = glow
  context.shadowBlur = radius * .8
  context.strokeStyle = color
  context.lineWidth = Math.max(2.4, radius * .16)
  context.beginPath()
  context.moveTo(shaftStart.x, shaftStart.y)
  context.lineTo(tip.x - direction.x * headLength, tip.y - direction.y * headLength)
  context.stroke()
  context.shadowBlur = 0
  context.fillStyle = color
  context.beginPath()
  context.moveTo(tip.x, tip.y)
  context.lineTo(
    tip.x - direction.x * headLength + normal.x * headWidth,
    tip.y - direction.y * headLength + normal.y * headWidth,
  )
  context.lineTo(
    tip.x - direction.x * headLength - normal.x * headWidth,
    tip.y - direction.y * headLength - normal.y * headWidth,
  )
  context.closePath()
  context.fill()
  context.strokeStyle = 'rgba(255,255,255,.9)'
  context.lineWidth = Math.max(1, radius * .05)
  context.stroke()
  context.restore()
}
