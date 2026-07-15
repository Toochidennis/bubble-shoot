import { describe, expect, it } from 'vitest'

import {
  BUBBLE_VISUAL_THEME_REGISTRY,
  getBubbleVisualThemeDefinition,
  getBubbleVisualThemeForLevel,
  getBubbleVisualVariant,
} from './bubbleVisualTheme'
import { BUBBLE_COLOR_STOPS, drawBubble } from './drawGameplayFrame'

describe('normal bubble visual themes', () => {
  it('maps the approved level eras deterministically', () => {
    expect(getBubbleVisualThemeForLevel(1)).toBe('CLASSIC_GLOSS')
    expect(getBubbleVisualThemeForLevel(5)).toBe('CLASSIC_GLOSS')
    expect(getBubbleVisualThemeForLevel(6)).toBe('PEARL_GLASS')
    expect(getBubbleVisualThemeForLevel(15)).toBe('PEARL_GLASS')
    expect(getBubbleVisualThemeForLevel(16)).toBe('CRYSTAL_CORE')
    expect(getBubbleVisualThemeForLevel(30)).toBe('CRYSTAL_CORE')
    expect(getBubbleVisualThemeForLevel(31)).toBe('NEBULA_ENERGY')
    expect(getBubbleVisualThemeForLevel(60)).toBe('NEBULA_ENERGY')
    expect(getBubbleVisualThemeForLevel(61)).toBe('FACETED_GEM')
    expect(getBubbleVisualThemeForLevel(100)).toBe('FACETED_GEM')
    expect(getBubbleVisualThemeForLevel(101)).toBe(getBubbleVisualThemeForLevel(101))
    expect(getBubbleVisualThemeForLevel(121)).not.toBe(getBubbleVisualThemeForLevel(101))
  })

  it('contains every approved family with valid rendering metadata', () => {
    expect(BUBBLE_VISUAL_THEME_REGISTRY.map((theme) => theme.id)).toEqual([
      'CLASSIC_GLOSS',
      'PEARL_GLASS',
      'CRYSTAL_CORE',
      'NEBULA_ENERGY',
      'FACETED_GEM',
    ])
    for (const theme of BUBBLE_VISUAL_THEME_REGISTRY) {
      expect(theme.description.length).toBeGreaterThan(0)
      expect(theme.shellOpacity).toBeGreaterThanOrEqual(0)
      expect(theme.shellOpacity).toBeLessThanOrEqual(1)
      expect(getBubbleVisualThemeDefinition(theme.id)).toEqual(theme)
    }
    for (const color of ['blue', 'green', 'purple', 'red', 'yellow'] as const) {
      for (const theme of BUBBLE_VISUAL_THEME_REGISTRY) {
        expect(BUBBLE_COLOR_STOPS[color].base).toMatch(/^#/) 
        expect(theme.id).toBeTruthy()
      }
    }
  })

  it('keeps pure saturated BubbleColor bodies dominant across every family', () => {
    const bodies = Object.values(BUBBLE_COLOR_STOPS).map((stops) => stops.base)
    expect(new Set(bodies).size).toBe(5)
    for (const stops of Object.values(BUBBLE_COLOR_STOPS)) {
      const channels = [1, 3, 5].map((offset) => Number.parseInt(stops.base.slice(offset, offset + 2), 16))
      expect(Math.max(...channels) - Math.min(...channels)).toBeGreaterThan(75)
      expect(Math.max(...channels)).toBeGreaterThanOrEqual(100)
      expect(Math.max(...channels)).toBeLessThanOrEqual(235)
      expect(stops.dark).not.toBe('#ffffff')
      expect(stops.light).not.toBe('#ffffff')
    }
    for (const theme of BUBBLE_VISUAL_THEME_REGISTRY) expect(theme.shellOpacity).toBeLessThanOrEqual(.05)
  })

  it('provides controlled deterministic board variation for every gameplay color', () => {
    for (const color of ['blue', 'green', 'purple', 'red', 'yellow'] as const) {
      const first = getBubbleVisualVariant(2, 3, color)
      expect(first).toEqual(getBubbleVisualVariant(2, 3, color))
      expect(first.highlightX).toBeLessThan(0)
      expect(first.internalLight).toBeGreaterThan(0)
    }
    expect(getBubbleVisualVariant(2, 3, 'blue')).not.toEqual(getBubbleVisualVariant(3, 4, 'blue'))
  })

  it('renders every normal color and marked overlay through every family', () => {
    const gradient = { addColorStop: () => undefined }
    const context = {
      createRadialGradient: () => gradient,
      save: () => undefined,
      restore: () => undefined,
      beginPath: () => undefined,
      closePath: () => undefined,
      arc: () => undefined,
      ellipse: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      fill: () => undefined,
      stroke: () => undefined,
    } as unknown as CanvasRenderingContext2D

    for (const theme of BUBBLE_VISUAL_THEME_REGISTRY) {
      for (const color of ['blue', 'green', 'purple', 'red', 'yellow'] as const) {
        expect(() => drawBubble(context, 40, 40, 14, { color, marked: true }, theme.id)).not.toThrow()
      }
    }
  })
})
