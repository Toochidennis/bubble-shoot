import { getNeighborCoordinates } from '../grid/neighbors'
import { isValidCoordinate } from '../grid/coordinates'
import { DEFAULT_HEX_GRID_CONFIG } from '../grid/gridConfig'
import type { GridCoordinate } from '../grid/types'
import type { HexGridConfig } from '../grid/gridConfig'
import type { TemplateAccessResult, TemplateDefinition, TemplateInspection } from './types'

const requiredTemplateIds = [
  'triangle', 'diamond', 'wave', 'columns', 'split-clusters',
  'hanging-clusters', 'tunnel', 'wide-top', 'islands', 'zigzag',
] as const

function coordinate(row: number, column: number): GridCoordinate { return { row, column } }

function bounded(config: HexGridConfig, row: number, column: number): GridCoordinate | null {
  const next = coordinate(row, column)
  return isValidCoordinate(config, next) ? next : null
}

function uniqueCoordinates(values: readonly GridCoordinate[]): GridCoordinate[] {
  const seen = new Set<string>()
  const result: GridCoordinate[] = []
  for (const value of values) {
    const key = `${value.row}:${value.column}`
    if (!seen.has(key)) { seen.add(key); result.push(value) }
  }
  return result
}

function rows(config: HexGridConfig, rowNumbers: readonly number[], columnsForRow: (row: number) => readonly number[]): GridCoordinate[] {
  return uniqueCoordinates(rowNumbers.flatMap((row) => columnsForRow(row).flatMap((column) => {
    const value = bounded(config, row, column)
    return value === null ? [] : [value]
  })))
}

function centeredColumns(config: HexGridConfig, row: number, width: number): readonly number[] {
  const rowWidth = row % 2 === 0 ? config.evenRowWidth : config.oddRowWidth
  const safeWidth = Math.min(Math.max(1, width), rowWidth)
  const start = Math.floor((rowWidth - safeWidth) / 2)
  return Array.from({ length: safeWidth }, (_, index) => start + index)
}

function triangle(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2, 3], (row) => centeredColumns(config, row, row + 1))
}

function diamond(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2, 3, 4], (row) => centeredColumns(config, row, row <= 2 ? row * 2 + 1 : (4 - row) * 2 + 1))
}

function wave(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2, 3, 4, 5], (row) => Array.from({ length: 4 }, (_, index) => (row % 2 === 0 ? 1 : 2) + index))
}

function columns(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2, 3, 4], () => [1, 2, 4, 5])
}

function splitClusters(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2, 3], () => [1, 2, 4, 5])
}

function hangingClusters(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2, 3, 4], (row) => row === 0 ? [2, 4] : [2, 4, 3])
}

function tunnel(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2, 3, 4, 5], () => [1, 2, 4, 5])
}

function wideTop(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2], (row) => centeredColumns(config, row, row === 0 ? (row % 2 === 0 ? config.evenRowWidth : config.oddRowWidth) : 5 - row))
}

function islands(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2, 3], (row) => row === 0 ? [1, 2, 4, 5] : [1, 2, 4, 5])
}

function zigzag(config: HexGridConfig): readonly GridCoordinate[] {
  return rows(config, [0, 1, 2, 3, 4, 5], (row) => row % 2 === 0 ? [1, 2, 3] : [2, 3, 4])
}

export const TEMPLATE_REGISTRY: readonly TemplateDefinition[] = Object.freeze([
  { id: 'triangle', name: 'Triangle', difficulty: 'easy', ceilingSupport: 'guaranteed', symmetry: 'vertical', densityGuidance: 'balanced', minimumRows: 4, minimumEvenRowWidth: 4, minimumOddRowWidth: 3, createCoordinates: triangle },
  { id: 'diamond', name: 'Diamond', difficulty: 'easy', ceilingSupport: 'guaranteed', symmetry: 'vertical', densityGuidance: 'balanced', minimumRows: 5, minimumEvenRowWidth: 5, minimumOddRowWidth: 5, createCoordinates: diamond },
  { id: 'wave', name: 'Wave', difficulty: 'medium', ceilingSupport: 'guaranteed', symmetry: 'horizontal', densityGuidance: 'balanced', minimumRows: 6, minimumEvenRowWidth: 5, minimumOddRowWidth: 4, createCoordinates: wave },
  { id: 'columns', name: 'Columns', difficulty: 'medium', ceilingSupport: 'guaranteed', symmetry: 'vertical', densityGuidance: 'balanced', minimumRows: 5, minimumEvenRowWidth: 6, minimumOddRowWidth: 6, createCoordinates: columns },
  { id: 'split-clusters', name: 'Split Clusters', difficulty: 'medium', ceilingSupport: 'guaranteed', symmetry: 'vertical', densityGuidance: 'sparse', minimumRows: 4, minimumEvenRowWidth: 6, minimumOddRowWidth: 6, createCoordinates: splitClusters },
  { id: 'hanging-clusters', name: 'Hanging Clusters', difficulty: 'hard', ceilingSupport: 'guaranteed', symmetry: 'vertical', densityGuidance: 'balanced', minimumRows: 5, minimumEvenRowWidth: 6, minimumOddRowWidth: 5, createCoordinates: hangingClusters },
  { id: 'tunnel', name: 'Tunnel', difficulty: 'hard', ceilingSupport: 'guaranteed', symmetry: 'vertical', densityGuidance: 'sparse', minimumRows: 6, minimumEvenRowWidth: 6, minimumOddRowWidth: 6, createCoordinates: tunnel },
  { id: 'wide-top', name: 'Wide Top', difficulty: 'easy', ceilingSupport: 'guaranteed', symmetry: 'vertical', densityGuidance: 'dense', minimumRows: 3, minimumEvenRowWidth: 7, minimumOddRowWidth: 6, createCoordinates: wideTop },
  { id: 'islands', name: 'Islands', difficulty: 'challenge', ceilingSupport: 'guaranteed', symmetry: 'vertical', densityGuidance: 'sparse', minimumRows: 4, minimumEvenRowWidth: 6, minimumOddRowWidth: 6, createCoordinates: islands },
  { id: 'zigzag', name: 'Zigzag', difficulty: 'medium', ceilingSupport: 'guaranteed', symmetry: 'none', densityGuidance: 'balanced', minimumRows: 6, minimumEvenRowWidth: 5, minimumOddRowWidth: 5, createCoordinates: zigzag },
])

// Generated levels are resolved on demand and repeatedly inspect the same
// templates. Cache immutable inspections by grid signature so the 10,000-level
// generator remains responsive without changing deterministic output.
const inspectionCache = new Map<string, TemplateInspection>()

function supportsConfiguration(template: TemplateDefinition, config: HexGridConfig): boolean {
  return config.rowCount >= template.minimumRows && config.evenRowWidth >= template.minimumEvenRowWidth && config.oddRowWidth >= template.minimumOddRowWidth
}

function sortedKey(coordinate: GridCoordinate): string { return `${coordinate.row}:${coordinate.column}` }

function isCeilingConnected(coordinates: readonly GridCoordinate[], config: HexGridConfig): boolean {
  const occupied = new Set(coordinates.map(sortedKey))
  const queue = coordinates.filter((value) => value.row === 0)
  const visited = new Set(queue.map(sortedKey))
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]
    if (current === undefined) continue
    for (const neighbor of getNeighborCoordinates(config, current)) {
      const key = sortedKey(neighbor)
      if (occupied.has(key) && !visited.has(key)) { visited.add(key); queue.push(neighbor) }
    }
  }
  return occupied.size > 0 && visited.size === occupied.size
}

export function validateTemplate(template: TemplateDefinition, config: HexGridConfig = DEFAULT_HEX_GRID_CONFIG): void {
  const validDifficulty = ['easy', 'medium', 'hard', 'challenge'].includes(template.difficulty)
  const validSupport = ['guaranteed', 'requires-validation'].includes(template.ceilingSupport)
  const validDensity = ['sparse', 'balanced', 'dense'].includes(template.densityGuidance)
  const validSymmetry = ['none', 'horizontal', 'vertical', 'radial'].includes(template.symmetry)
  if (template.id.length === 0 || template.name.length === 0 || !validDifficulty || !validSupport || !validDensity || !validSymmetry || !Number.isSafeInteger(template.minimumRows) || template.minimumRows <= 0 || !Number.isSafeInteger(template.minimumEvenRowWidth) || template.minimumEvenRowWidth <= 0 || !Number.isSafeInteger(template.minimumOddRowWidth) || template.minimumOddRowWidth <= 0 || !supportsConfiguration(template, config)) throw new RangeError(`Template ${template.id} metadata or configuration is invalid.`)
  const first = template.createCoordinates(config)
  const second = template.createCoordinates(config)
  if (first.length === 0 || first.length !== second.length || first.some((value, index) => sortedKey(value) !== sortedKey(second[index]!))) throw new RangeError(`Template ${template.id} is not deterministic or is empty.`)
  const seen = new Set<string>()
  for (const value of first) {
    if (!isValidCoordinate(config, value)) throw new RangeError(`Template ${template.id} emitted an invalid coordinate.`)
    const key = sortedKey(value)
    if (seen.has(key)) throw new RangeError(`Template ${template.id} emitted a duplicate coordinate.`)
    seen.add(key)
  }
  if (template.ceilingSupport === 'guaranteed' && !isCeilingConnected(first, config)) throw new RangeError(`Template ${template.id} is not ceiling-connected.`)
}

export function validateTemplateRegistry(registry: readonly TemplateDefinition[] = TEMPLATE_REGISTRY): void {
  const ids = new Set<string>()
  for (const template of registry) {
    if (ids.has(template.id)) throw new RangeError(`Duplicate template id ${template.id}.`)
    ids.add(template.id)
    validateTemplate(template)
  }
  for (const requiredId of requiredTemplateIds) {
    if (!ids.has(requiredId)) throw new RangeError(`Required template ${requiredId} is missing.`)
  }
}

function toInspection(template: TemplateDefinition, config: HexGridConfig): TemplateInspection {
  return Object.freeze({
    id: template.id,
    name: template.name,
    difficulty: template.difficulty,
    ceilingSupport: template.ceilingSupport,
    symmetry: template.symmetry,
    densityGuidance: template.densityGuidance,
    coordinates: Object.freeze(template.createCoordinates(config).map((value) => Object.freeze({ ...value }))),
  })
}

export function getTemplate(templateId: string, config: HexGridConfig = DEFAULT_HEX_GRID_CONFIG): TemplateAccessResult {
  const template = TEMPLATE_REGISTRY.find((candidate) => candidate.id === templateId)
  if (template === undefined) return { ok: false, reason: 'unknown-template' }
  if (!supportsConfiguration(template, config)) return { ok: false, reason: 'unsupported-configuration' }
  const cacheKey = `${templateId}:${config.rowCount}:${config.evenRowWidth}:${config.oddRowWidth}`
  const cached = inspectionCache.get(cacheKey)
  if (cached !== undefined) return { ok: true, template: cached }
  validateTemplate(template, config)
  const inspection = toInspection(template, config)
  inspectionCache.set(cacheKey, inspection)
  return { ok: true, template: inspection }
}

export function getTemplateIds(): readonly string[] {
  return Object.freeze(TEMPLATE_REGISTRY.map((template) => template.id))
}

validateTemplateRegistry()
