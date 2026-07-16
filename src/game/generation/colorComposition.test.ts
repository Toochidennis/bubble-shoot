import { describe, expect, it } from 'vitest'
import { DEFAULT_HEX_GRID_CONFIG } from '../grid/gridConfig'
import type { BubbleColor } from '../shooter/types'
import { analyzeGeneratedBoard } from './analysis'
import { buildGeneratedBoardShape } from './boardBuilder'
import { COLOR_COMPOSITION_IDS, composeBubbleColors } from './colorComposition'
import { getTemplate } from '../templates/templateRegistry'

const palette: readonly BubbleColor[] = ['blue', 'green', 'purple', 'red']
const template = getTemplate('wide-top', DEFAULT_HEX_GRID_CONFIG)
if (!template.ok) throw new Error('Expected wide-top template.')
const shape = buildGeneratedBoardShape(16, DEFAULT_HEX_GRID_CONFIG, template.template.coordinates, template.template.id, 'composition-test')

describe('generated color compositions', () => {
  it('registers every approved deterministic composition without changing BubbleColor', () => {
    expect(COLOR_COMPOSITION_IDS).toEqual([
      'ORGANIC_CLUSTERS', 'WAVES', 'SPIRAL_FLOW', 'COLOR_RINGS', 'MIRRORED_WINGS',
      'FLAME_FLOW', 'ZIGZAG_FLOW', 'DIAGONAL_FLOW', 'COLOR_CORE', 'SPLIT_TONES',
    ])
    for (const style of COLOR_COMPOSITION_IDS) {
      const first = composeBubbleColors(shape.coordinates, palette, style, DEFAULT_HEX_GRID_CONFIG, 'same-seed')
      const second = composeBubbleColors(shape.coordinates, palette, style, DEFAULT_HEX_GRID_CONFIG, 'same-seed')
      expect([...first]).toEqual([...second])
      expect([...first.values()].every((color) => palette.includes(color))).toBe(true)
      const placements = shape.coordinates.map((coordinate) => ({ coordinate, color: first.get(`${coordinate.row}:${coordinate.column}`)! }))
      const analysis = analyzeGeneratedBoard(DEFAULT_HEX_GRID_CONFIG, placements)
      expect(analysis.largestSameColorClusterSize).toBeLessThanOrEqual(8)
    }
  })
})

