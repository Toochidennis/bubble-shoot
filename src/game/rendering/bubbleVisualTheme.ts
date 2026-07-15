import type { BubbleColor } from '../shooter/types'

/** Rendering-only normal-bubble families. Gameplay identity remains BubbleColor. */
export type BubbleVisualTheme =
  | 'CLASSIC_GLOSS'
  | 'PEARL_GLASS'
  | 'CRYSTAL_CORE'
  | 'NEBULA_ENERGY'
  | 'FACETED_GEM'

export interface BubbleVisualThemeDefinition {
  readonly id: BubbleVisualTheme
  readonly name: string
  readonly description: string
  readonly shellOpacity: number
  readonly facetCount: number
}

export const BUBBLE_VISUAL_THEME_REGISTRY: readonly BubbleVisualThemeDefinition[] = Object.freeze([
  Object.freeze({ id: 'CLASSIC_GLOSS' as const, name: 'Classic Gloss', description: 'Clean glossy onboarding sphere', shellOpacity: 0, facetCount: 0 }),
  Object.freeze({ id: 'PEARL_GLASS' as const, name: 'Pearl Glass', description: 'Deep-color sphere with a restrained pearl rim', shellOpacity: .05, facetCount: 0 }),
  Object.freeze({ id: 'CRYSTAL_CORE' as const, name: 'Crystal Core', description: 'Saturated sphere with a same-color crystal core', shellOpacity: .04, facetCount: 4 }),
  Object.freeze({ id: 'NEBULA_ENERGY' as const, name: 'Nebula Energy', description: 'Dark saturated sphere with same-color energy', shellOpacity: .03, facetCount: 0 }),
  Object.freeze({ id: 'FACETED_GEM' as const, name: 'Faceted Gem', description: 'Deep gemstone sphere with colored light planes', shellOpacity: .03, facetCount: 6 }),
])

const THEME_BY_ID: Readonly<Record<BubbleVisualTheme, BubbleVisualThemeDefinition>> = Object.freeze(
  Object.fromEntries(BUBBLE_VISUAL_THEME_REGISTRY.map((definition) => [definition.id, definition])) as Record<BubbleVisualTheme, BubbleVisualThemeDefinition>,
)
const BUBBLE_COLOR_ORDER: readonly BubbleColor[] = ['blue', 'green', 'purple', 'red', 'yellow']

/**
 * Stable level-era mapping. The value is presentation metadata only and is
 * intentionally not persisted or consulted by matching, physics, or scoring.
 */
export function getBubbleVisualThemeForLevel(levelId: number): BubbleVisualTheme {
  if (!Number.isSafeInteger(levelId) || levelId < 1) return 'CLASSIC_GLOSS'
  if (levelId <= 5) return 'CLASSIC_GLOSS'
  if (levelId <= 15) return 'PEARL_GLASS'
  if (levelId <= 30) return 'CRYSTAL_CORE'
  if (levelId <= 60) return 'NEBULA_ENERGY'
  if (levelId <= 100) return 'FACETED_GEM'

  const rotating: readonly BubbleVisualTheme[] = ['CLASSIC_GLOSS', 'PEARL_GLASS', 'CRYSTAL_CORE', 'NEBULA_ENERGY', 'FACETED_GEM']
  const bandSize = levelId < 1_000 ? 20 : 30
  return rotating[Math.floor((levelId - 101) / bandSize) % rotating.length] ?? 'CLASSIC_GLOSS'
}

export function getBubbleVisualThemeDefinition(theme: BubbleVisualTheme): BubbleVisualThemeDefinition {
  return THEME_BY_ID[theme]
}

export interface BubbleVisualVariant {
  readonly highlightX: number
  readonly highlightY: number
  readonly reflectionAngle: number
  readonly internalLight: number
}

/** Deterministic, restrained board variation; no random entropy is used. */
export function getBubbleVisualVariant(row: number, column: number, color: BubbleColor): BubbleVisualVariant {
  const colorIndex = BUBBLE_COLOR_ORDER.indexOf(color)
  const hash = Math.abs((row * 37 + column * 17 + colorIndex * 13) % 11)
  return {
    highlightX: -.38 + (hash % 3) * .035,
    highlightY: -.42 + (Math.floor(hash / 3) % 3) * .035,
    reflectionAngle: -.6 + (hash % 5) * .17,
    internalLight: .18 + (hash % 4) * .025,
  }
}
