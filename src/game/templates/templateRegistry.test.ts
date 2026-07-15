import { describe, expect, it } from 'vitest'
import { DEFAULT_HEX_GRID_CONFIG } from '../grid/gridConfig'
import { getNeighborCoordinates } from '../grid/neighbors'
import { getTemplate, getTemplateIds, TEMPLATE_REGISTRY } from './templateRegistry'

function key(value: { row: number; column: number }): string { return `${value.row}:${value.column}` }

describe('reusable structural template registry', () => {
  it('contains every required family in deterministic order', () => {
    expect(getTemplateIds()).toEqual(['triangle', 'diamond', 'wave', 'columns', 'split-clusters', 'hanging-clusters', 'tunnel', 'wide-top', 'islands', 'zigzag'])
    expect(new Set(getTemplateIds()).size).toBe(TEMPLATE_REGISTRY.length)
  })

  it('returns explicit unknown and unsupported configuration failures', () => {
    expect(getTemplate('missing')).toEqual({ ok: false, reason: 'unknown-template' })
    expect(getTemplate('diamond', { ...DEFAULT_HEX_GRID_CONFIG, rowCount: 2 })).toEqual({ ok: false, reason: 'unsupported-configuration' })
  })

  it('emits deterministic valid unique coordinates and truthful ceiling support', () => {
    for (const id of getTemplateIds()) {
      const first = getTemplate(id)
      const second = getTemplate(id)
      expect(first).toEqual(second)
      if (!first.ok || !second.ok) continue
      expect(first.template.coordinates.length).toBeGreaterThan(0)
      expect(new Set(first.template.coordinates.map(key)).size).toBe(first.template.coordinates.length)
      if (first.template.ceilingSupport === 'guaranteed') {
        const occupied = new Set(first.template.coordinates.map(key))
        const queue = first.template.coordinates.filter((value) => value.row === 0)
        const visited = new Set(queue.map(key))
        for (let index = 0; index < queue.length; index += 1) {
          const current = queue[index]
          if (current === undefined) continue
          for (const neighbor of getNeighborCoordinates(DEFAULT_HEX_GRID_CONFIG, current)) {
            const neighborKey = key(neighbor)
            if (occupied.has(neighborKey) && !visited.has(neighborKey)) { visited.add(neighborKey); queue.push(neighbor) }
          }
        }
        expect(visited.size).toBe(occupied.size)
      }
    }
  })

  it('preserves practical family shape distinctions', () => {
    const triangle = getTemplate('triangle')
    const diamond = getTemplate('diamond')
    const columns = getTemplate('columns')
    const split = getTemplate('split-clusters')
    const wideTop = getTemplate('wide-top')
    const zigzag = getTemplate('zigzag')
    if (!triangle.ok || !diamond.ok || !columns.ok || !split.ok || !wideTop.ok || !zigzag.ok) throw new Error('Required templates unavailable.')
    const rowCount = (coordinates: readonly { row: number }[], row: number) => coordinates.filter((value) => value.row === row).length
    expect(rowCount(triangle.template.coordinates, 0)).toBeLessThan(rowCount(triangle.template.coordinates, 3))
    expect(rowCount(diamond.template.coordinates, 2)).toBeGreaterThan(rowCount(diamond.template.coordinates, 0))
    expect(new Set(columns.template.coordinates.filter((value) => value.row === 1).map((value) => value.column)).size).toBeGreaterThan(2)
    expect(new Set(split.template.coordinates.filter((value) => value.row === 0).map((value) => value.column)).size).toBe(4)
    expect(rowCount(wideTop.template.coordinates, 0)).toBeGreaterThan(rowCount(wideTop.template.coordinates, 2))
    expect(new Set(zigzag.template.coordinates.filter((value) => value.row === 0).map((value) => value.column)).size).toBeGreaterThan(1)
  })
})
