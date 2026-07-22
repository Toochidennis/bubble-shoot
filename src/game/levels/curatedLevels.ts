import { isValidCoordinate } from '../grid/coordinates'
import { DEFAULT_HEX_GRID_CONFIG } from '../grid/gridConfig'
import { getNeighborCoordinates } from '../grid/neighbors'
import type { BubbleColor } from '../shooter/types'
import { deriveStarThresholds } from './types'
import type { CuratedBubblePlacement, CuratedLevelDefinition } from './types'
import { boardClearPar, computeShotBudget } from '../generation/shotBudget'

const colors = (...values: BubbleColor[]): readonly BubbleColor[] => values

function rowWidth(row: number): number {
  return row % 2 === 0 ? DEFAULT_HEX_GRID_CONFIG.evenRowWidth : DEFAULT_HEX_GRID_CONFIG.oddRowWidth
}

function centeredColumns(row: number, count: number): readonly number[] {
  const width = rowWidth(row)
  if (count >= width) return Array.from({ length: width }, (_, column) => column)
  const start = Math.floor((width - count) / 2)
  return Array.from({ length: count }, (_, offset) => start + offset)
}

function colorIndexFor(levelId: number, row: number, column: number, paletteSize: number): number {
  const x = column + (row % 2 === 0 ? 0 : .5)
  // A broad wave plus a small deterministic local phase creates visible
  // arches and ribbons without collapsing into repeated two-column stripes.
  const localPhase = (row * 7 + column * 5 + levelId * 3) % 4 === 0 ? 1 : 0
  const value = (() => {
    switch (levelId % 6) {
      case 0: return Math.floor(row * .8 + x * .7) + localPhase
      case 1: return Math.floor(Math.abs(x - 5) * .8 + row * .55) + localPhase
      case 2: return Math.floor(x * .75 + row * 1.15) + localPhase
      case 3: return Math.floor(Math.hypot(x - 5, row - 5) * .9) + localPhase
      case 4: return Math.floor(row * .45 + x * .9) + localPhase
      default: return Math.floor(row * .95 + x * .55) + localPhase
    }
  })()
  return value % Math.max(1, paletteSize)
}

function denseCuratedPattern(levelId: number, targetCount: number, palette: readonly BubbleColor[]): readonly CuratedBubblePlacement[] {
  const placements: CuratedBubblePlacement[] = []
  let remaining = targetCount
  for (let row = 0; row < DEFAULT_HEX_GRID_CONFIG.rowCount && remaining > 0; row += 1) {
    const count = Math.min(rowWidth(row), remaining)
    for (const column of centeredColumns(row, count)) {
      const base = colorIndexFor(levelId, row, column, palette.length)
      const color = palette[Math.abs(base + (row + column + levelId) % 2) % palette.length]!
      placements.push({ coordinate: { row, column }, color })
    }
    remaining -= count
  }
  return placements
}

// Boards, colors, and missions are authored here; the shot budget is DERIVED
// centrally (par × fairness margin) so curated and generated levels ride one
// difficulty curve instead of a hand-tuned, drift-prone ladder.
const CURATED_LEVEL_SEED: readonly Omit<CuratedLevelDefinition, 'shotLimit'>[] = [
  { id: 1, displayNumber: 1, allowedColors: colors('blue', 'green', 'red'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'basic-onboarding', focus: 'Round shield with simple three-color lanes', startingBubbles: denseCuratedPattern(1, 59, colors('blue', 'green', 'red')) },
  { id: 2, displayNumber: 2, allowedColors: colors('blue', 'green', 'red'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'basic-onboarding', focus: 'Full crown with friendly color pockets', startingBubbles: denseCuratedPattern(2, 64, colors('blue', 'green', 'red')) },
  { id: 3, displayNumber: 3, allowedColors: colors('blue', 'green', 'red'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'basic-onboarding', focus: 'Dense diagonal ribbons with easy matches', startingBubbles: denseCuratedPattern(3, 69, colors('green', 'blue', 'red')) },
  { id: 4, displayNumber: 4, allowedColors: colors('blue', 'green', 'red'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'basic-onboarding', focus: 'Rounded mass with color-core illusion', startingBubbles: denseCuratedPattern(4, 74, colors('blue', 'red', 'green')) },
  { id: 5, displayNumber: 5, allowedColors: colors('blue', 'green', 'red'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'basic-onboarding', focus: 'Dense wave bands with three-color clusters', startingBubbles: denseCuratedPattern(5, 79, colors('red', 'blue', 'green')) },
  { id: 6, displayNumber: 6, allowedColors: colors('blue', 'green', 'red'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'early-skill-building', focus: 'Full upper board with side-color lanes', startingBubbles: denseCuratedPattern(6, 84, colors('blue', 'green', 'red')) },
  { id: 7, displayNumber: 7, allowedColors: colors('blue', 'green', 'red', 'yellow'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'early-skill-building', focus: 'Four-color shield with split wings', startingBubbles: denseCuratedPattern(7, 89, colors('yellow', 'blue', 'green', 'red')) },
  { id: 8, displayNumber: 8, allowedColors: colors('blue', 'green', 'red', 'yellow'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'early-skill-building', focus: 'Dense diagonal color ribbons', startingBubbles: denseCuratedPattern(8, 94, colors('red', 'yellow', 'green', 'blue')) },
  { id: 9, displayNumber: 9, allowedColors: colors('blue', 'green', 'red'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'early-skill-building', focus: 'Full three-color board with broad waves', startingBubbles: denseCuratedPattern(9, 99, colors('green', 'blue', 'red')) },
  { id: 10, displayNumber: 10, allowedColors: colors('blue', 'green', 'red', 'yellow'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'early-skill-building', focus: 'Broad crown with multiple color lanes', startingBubbles: denseCuratedPattern(10, 104, colors('blue', 'green', 'yellow', 'red')) },
  { id: 11, displayNumber: 11, allowedColors: colors('blue', 'green', 'red', 'yellow'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'stronger-onboarding', focus: 'Dense split-color wings', startingBubbles: denseCuratedPattern(11, 109, colors('red', 'blue', 'green', 'yellow')) },
  { id: 12, displayNumber: 12, allowedColors: colors('blue', 'green', 'red', 'yellow'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'stronger-onboarding', focus: 'Full layered arch with diagonal colors', startingBubbles: denseCuratedPattern(12, 114, colors('blue', 'green', 'red', 'yellow')) },
  { id: 13, displayNumber: 13, allowedColors: colors('blue', 'green', 'red', 'yellow'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'stronger-onboarding', focus: 'Alternate color paths through a deep board', startingBubbles: denseCuratedPattern(13, 119, colors('green', 'yellow', 'blue', 'red')) },
  { id: 14, displayNumber: 14, allowedColors: colors('blue', 'green', 'red', 'yellow'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'stronger-onboarding', focus: 'Full crown with split-color illusion', startingBubbles: denseCuratedPattern(14, 124, colors('red', 'blue', 'yellow', 'green')) },
  { id: 15, displayNumber: 15, allowedColors: colors('blue', 'green', 'red', 'yellow'), mission: { type: 'CLEAR_ALL_BUBBLES' }, onboardingBand: 'stronger-onboarding', focus: 'Final dense color-core board', startingBubbles: denseCuratedPattern(15, 129, colors('blue', 'yellow', 'green', 'red')) },
]

export const CURATED_LEVELS: readonly CuratedLevelDefinition[] = CURATED_LEVEL_SEED.map((level) =>
  Object.freeze({
    ...level,
    shotLimit: computeShotBudget(boardClearPar(level.startingBubbles.length, level.allowedColors.length), level.id),
  }),
)

export function getCuratedLevel(levelId: number): CuratedLevelDefinition | undefined {
  return CURATED_LEVELS.find((level) => level.id === levelId)
}

export interface CuratedStructureMetrics {
  readonly startingBubbleCount: number
  readonly occupiedRowCount: number
  readonly topRowRootCount: number
  readonly sameColorClusterSizes: readonly number[]
  readonly narrowSupportArticulationCandidates: number
  readonly lowerHangingDepth: number
  readonly lowerContourWidth: number
  readonly repeatedTwoColumnBandCount: number
}

export function getCuratedStructureMetrics(level: CuratedLevelDefinition): CuratedStructureMetrics {
  const occupied = new Map(level.startingBubbles.map((placement) => [coordinateKey(placement.coordinate), placement]))
  const rows = new Set(level.startingBubbles.map((placement) => placement.coordinate.row))
  const sameColorClusterSizes: number[] = []
  const visitedColor = new Set<string>()
  for (const placement of level.startingBubbles) {
    const originKey = coordinateKey(placement.coordinate)
    if (visitedColor.has(originKey)) continue
    const queue = [placement.coordinate]
    visitedColor.add(originKey)
    let size = 0
    while (queue.length > 0) {
      const coordinate = queue.shift()!
      size += 1
      for (const neighbor of getNeighborCoordinates(DEFAULT_HEX_GRID_CONFIG, coordinate)) {
        const key = coordinateKey(neighbor)
        const candidate = occupied.get(key)
        if (candidate?.color === placement.color && !visitedColor.has(key)) {
          visitedColor.add(key)
          queue.push(neighbor)
        }
      }
    }
    sameColorClusterSizes.push(size)
  }
  sameColorClusterSizes.sort((left, right) => left - right)

  // This is a presentation/content metric, not a runtime resolver. A local
  // neck estimate keeps validation linear on 200-cell boards instead of
  // running a full flood fill once per bubble.
  let narrowSupportArticulationCandidates = 0
  for (const placement of level.startingBubbles) {
    if (placement.coordinate.row === 0) continue
    const parentCount = getNeighborCoordinates(DEFAULT_HEX_GRID_CONFIG, placement.coordinate)
      .filter((neighbor) => neighbor.row < placement.coordinate.row && occupied.has(coordinateKey(neighbor))).length
    if (parentCount <= 1) narrowSupportArticulationCandidates += 1
  }

  const rowCounts = new Map<number, number>()
  for (const placement of level.startingBubbles) {
    rowCounts.set(placement.coordinate.row, (rowCounts.get(placement.coordinate.row) ?? 0) + 1)
  }
  const repeatedPairs = new Map<string, number>()
  for (const placement of level.startingBubbles) {
    const { row, column } = placement.coordinate
    const right = occupied.get(`${row}:${column + 1}`)
    if (right?.color === placement.color) {
      const key = `${column}:${placement.color}`
      repeatedPairs.set(key, (repeatedPairs.get(key) ?? 0) + 1)
    }
  }

  return {
    startingBubbleCount: level.startingBubbles.length,
    occupiedRowCount: rows.size,
    topRowRootCount: level.startingBubbles.filter((placement) => placement.coordinate.row === 0).length,
    sameColorClusterSizes,
    narrowSupportArticulationCandidates,
    lowerHangingDepth: Math.max(...rows),
    lowerContourWidth: Math.max(...rowCounts.values()),
    repeatedTwoColumnBandCount: [...repeatedPairs.values()].filter((count) => count >= 3).length,
  }
}

function countSupported(occupied: ReadonlyMap<string, CuratedBubblePlacement>): number {
  const roots = [...occupied.values()].filter((placement) => placement.coordinate.row === 0)
  const visited = new Set<string>(roots.map((placement) => coordinateKey(placement.coordinate)))
  const queue = roots.map((placement) => placement.coordinate)
  while (queue.length > 0) {
    const coordinate = queue.shift()!
    for (const neighbor of getNeighborCoordinates(DEFAULT_HEX_GRID_CONFIG, coordinate)) {
      const key = coordinateKey(neighbor)
      if (occupied.has(key) && !visited.has(key)) {
        visited.add(key)
        queue.push(neighbor)
      }
    }
  }
  return visited.size
}

function coordinateKey(coordinate: { readonly row: number; readonly column: number }): string {
  return `${coordinate.row}:${coordinate.column}`
}

export function validateCuratedLevels(levels: readonly CuratedLevelDefinition[] = CURATED_LEVELS): void {
  const ids = new Set<number>()
  for (const level of levels) {
    if (ids.has(level.id) || !Number.isSafeInteger(level.id) || level.id < 1 || level.id > 15) {
      throw new RangeError(`Invalid curated level id ${level.id}.`)
    }
    ids.add(level.id)
    if (!Number.isSafeInteger(level.shotLimit) || level.shotLimit <= 0) {
      throw new RangeError(`Invalid shot limit for level ${level.id}.`)
    }
    const thresholds = deriveStarThresholds(level)
    if (!(thresholds.one > 0 && thresholds.one < thresholds.two && thresholds.two < thresholds.three)) {
      throw new RangeError(`Invalid star thresholds for level ${level.id}.`)
    }
    if (level.mission.type !== 'CLEAR_ALL_BUBBLES' || level.startingBubbles.length === 0) {
      throw new RangeError(`Invalid mission or empty board for level ${level.id}.`)
    }
    const allowed = new Set(level.allowedColors)
    const coordinates = new Set<string>()
    for (const placement of level.startingBubbles) {
      if (!allowed.has(placement.color) || !isValidCoordinate(DEFAULT_HEX_GRID_CONFIG, placement.coordinate)) {
        throw new RangeError(`Invalid placement in level ${level.id}.`)
      }
      const key = `${placement.coordinate.row}:${placement.coordinate.column}`
      if (coordinates.has(key)) {
        throw new RangeError(`Duplicate placement in level ${level.id}.`)
      }
      coordinates.add(key)
    }
    const expectedColorCount = level.id <= 5 || level.id === 9 ? 3 : level.id <= 10 ? level.allowedColors.length : 4
    if (level.id <= 5 && level.allowedColors.length !== 3) throw new RangeError(`Level ${level.id} must use 3 colors.`)
    if (level.id >= 11 && level.allowedColors.length !== 4) throw new RangeError(`Level ${level.id} must use 4 colors.`)
    if (expectedColorCount < 3) throw new RangeError(`Level ${level.id} color band is invalid.`)
    const occupied = new Map(level.startingBubbles.map((placement) => [coordinateKey(placement.coordinate), placement]))
    if (countSupported(occupied) !== occupied.size) throw new RangeError(`Level ${level.id} contains unsupported starting bubbles.`)
    const structure = getCuratedStructureMetrics(level)
    if (structure.topRowRootCount === 0) throw new RangeError(`Level ${level.id} must include ceiling roots.`)
    // Wider reference-style boards naturally repeat some adjacent color pairs;
    // reject only sustained striping across most of the 11-column crown.
    if (structure.repeatedTwoColumnBandCount > Math.max(2, DEFAULT_HEX_GRID_CONFIG.evenRowWidth - 4)) {
      throw new RangeError(`Level ${level.id} retains excessive two-column color striping.`)
    }
  }
  if (ids.size !== 15) throw new RangeError('Exactly 15 curated levels are required.')
}

validateCuratedLevels()
