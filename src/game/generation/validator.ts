import { isValidCoordinate, coordinateKey } from '../grid/coordinates'
import { getNeighborCoordinates } from '../grid/neighbors'
import { validateMissionConfiguration, normalizeMissionObjectives } from '../mission/missionRegistry'
import type { MissionConfig, MissionConfiguration } from '../mission/types'
import type { BubbleColor } from '../shooter/types'
import { getTemplate } from '../templates/templateRegistry'
import { MAX_GENERATED_SHOTS, MAX_GENERATION_RETRIES, MIN_GENERATED_SHOTS, FIRST_GENERATED_LEVEL_ID, MAX_SUPPORTED_LEVEL_ID, GENERATOR_CONFIG_VERSION, GENERATOR_VERSION, GENERATED_DENSITY_MAX, GENERATED_DENSITY_MIN } from './config'
import { deriveGenerationSeed } from './seed'
import type { GeneratedBoardMetrics, GeneratedLevelDefinition } from './types'
import { analyzeGeneratedBoard } from './analysis'
import { COLOR_COMPOSITION_IDS } from './colorComposition'
import { getGeneratedBubbleCountBand } from './boardBuilder'

export type GeneratedValidationResult = { readonly ok: true } | { readonly ok: false; readonly errors: readonly string[] }

export function estimateFloatingPotential(level: Pick<GeneratedLevelDefinition, 'startingBubbles'>): number {
  const lower = level.startingBubbles.filter((bubble) => bubble.coordinate.row > 0).length
  return Math.min(12, Math.max(0, Math.floor(lower / 4)))
}

export function estimateScoreUpper(level: Pick<GeneratedLevelDefinition, 'startingBubbles' | 'shotLimit'>): number {
  return level.startingBubbles.length * 15 + estimateFloatingPotential(level) * 20 + level.shotLimit * 25
}

export function objectiveCompletesOnBoardExhaustion(
  objective: MissionConfig,
  analysis: ReturnType<typeof analyzeGeneratedBoard>,
  markedCount: number,
): boolean {
  if (objective.type === 'CLEAR_ALL_BUBBLES') return true
  if (objective.type === 'POP_COLOR') return objective.targetCount <= analysis.colorCounts[objective.targetColor]
  if (objective.type === 'CLEAR_MARKED') return objective.targetCount <= markedCount
  if (objective.type === 'REACH_SCORE') return objective.targetScore <= analysis.conservativeScoreFloor
  return objective.targetCount <= analysis.validatedDropOpportunity
}

export function missionCompletesOnBoardExhaustion(
  configuration: MissionConfiguration,
  analysis: ReturnType<typeof analyzeGeneratedBoard>,
  markedCount: number,
): boolean {
  return normalizeMissionObjectives(configuration).every((objective) => objectiveCompletesOnBoardExhaustion(objective, analysis, markedCount))
}

function metricsMatch(expected: GeneratedBoardMetrics, actual: ReturnType<typeof analyzeGeneratedBoard>): boolean {
  const exactKeys: readonly (keyof GeneratedBoardMetrics)[] = [
    'validGridCapacity', 'intendedRegionCapacity', 'occupiedCellCount', 'occupiedRowCount',
    'largestEmptyCentralRegion', 'formationWidth', 'formationDepth',
    'largestSameColorClusterSize', 'validatedDropOpportunity', 'conservativeScoreFloor',
  ]
  if (exactKeys.some((key) => expected[key] !== actual[key])) return false
  return Math.abs(expected.occupancyRatio - actual.occupancyRatio) < 1e-9 &&
    Math.abs(expected.upperRowOccupancy - actual.upperRowOccupancy) < 1e-9 &&
    Math.abs(expected.averageSameColorClusterSize - actual.averageSameColorClusterSize) < 1e-9
}

function isCeilingConnected(level: GeneratedLevelDefinition): boolean {
  const seen = new Set(level.startingBubbles.map((bubble) => coordinateKey(bubble.coordinate)))
  const queue = level.startingBubbles.filter((bubble) => bubble.coordinate.row === 0).map((bubble) => bubble.coordinate)
  const visited = new Set(queue.map(coordinateKey))
  for (let index = 0; index < queue.length; index += 1) {
    for (const neighbor of getNeighborCoordinates(level.gridConfig, queue[index]!)) {
      const key = coordinateKey(neighbor)
      if (seen.has(key) && !visited.has(key)) {
        visited.add(key)
        queue.push(neighbor)
      }
    }
  }
  return seen.size > 0 && seen.size === visited.size
}

function hasTwoColumnStripeRegression(level: GeneratedLevelDefinition): boolean {
  if (level.startingBubbles.length < 20) return false
  const groupColors = new Map<number, Map<BubbleColor, number>>()
  for (const bubble of level.startingBubbles) {
    const group = Math.floor(bubble.coordinate.column / 2)
    const counts = groupColors.get(group) ?? new Map<BubbleColor, number>()
    counts.set(bubble.color, (counts.get(bubble.color) ?? 0) + 1)
    groupColors.set(group, counts)
  }
  const dominant = [...groupColors.values()].reduce((sum, counts) => sum + Math.max(...counts.values()), 0)
  return groupColors.size >= 3 && dominant / level.startingBubbles.length > .86
}

function combinedMissionEffort(configuration: MissionConfiguration): number {
  return normalizeMissionObjectives(configuration).reduce((sum, objective) => {
    if (objective.type === 'POP_COLOR') return sum + objective.targetCount / 3
    if (objective.type === 'DROP_BUBBLES') return sum + objective.targetCount * 1.5
    if (objective.type === 'CLEAR_MARKED') return sum + objective.targetCount / 2
    if (objective.type === 'REACH_SCORE') return sum + objective.targetScore / 60
    return sum
  }, 0)
}

export function validateGeneratedLevel(level: GeneratedLevelDefinition): GeneratedValidationResult {
  const errors: string[] = []
  try {
    if (!Number.isSafeInteger(level.id) || level.id < FIRST_GENERATED_LEVEL_ID || level.id > MAX_SUPPORTED_LEVEL_ID) errors.push('id is outside generated range')
    if (level.contentSource !== 'generated') errors.push('contentSource must be generated')
    if (level.generator.generatorVersion !== GENERATOR_VERSION || level.generator.generatorConfigVersion !== GENERATOR_CONFIG_VERSION) errors.push('generator version metadata is unsupported')
    if (!Number.isSafeInteger(level.generator.retryAttempt) || level.generator.retryAttempt < 0 || level.generator.retryAttempt > MAX_GENERATION_RETRIES) errors.push('retry attempt is invalid')
    if (level.generator.seed !== deriveGenerationSeed(level.id, level.generator.retryAttempt)) errors.push('seed does not match versioned identity')
    if (!COLOR_COMPOSITION_IDS.includes(level.generator.colorCompositionId)) errors.push('color composition is unknown')
    if (!Array.isArray(level.allowedColors) || level.allowedColors.length < 3 || level.allowedColors.length > 5) errors.push('allowed color palette is invalid')
    const colors = new Set<BubbleColor>(level.allowedColors)
    if (colors.size !== level.allowedColors.length) errors.push('allowed colors contain duplicates')
    if (!Number.isSafeInteger(level.shotLimit) || level.shotLimit < MIN_GENERATED_SHOTS || level.shotLimit > MAX_GENERATED_SHOTS) errors.push('shot limit is outside generated bounds')
    const band = getGeneratedBubbleCountBand(level.id)
    if (level.startingBubbles.length < band.minimum || level.startingBubbles.length > Math.min(band.maximum, level.generator.boardMetrics.validGridCapacity)) errors.push('generated bubble count is outside its level band')
    if (level.generator.targetBubbleCount !== level.startingBubbles.length) errors.push('target bubble count metadata is stale')
    const seen = new Set<string>()
    for (const bubble of level.startingBubbles) {
      if (!isValidCoordinate(level.gridConfig, bubble.coordinate)) errors.push('starting bubble coordinate is invalid')
      const key = coordinateKey(bubble.coordinate)
      if (seen.has(key)) errors.push('starting bubble coordinates contain duplicates')
      seen.add(key)
      if (!colors.has(bubble.color)) errors.push('starting bubble color is outside the palette')
    }
    const template = getTemplate(level.generator.templateId, level.gridConfig)
    if (!template.ok) errors.push(`template is unavailable: ${template.reason}`)
    else {
      const boardKeys = new Set(level.startingBubbles.map((bubble) => coordinateKey(bubble.coordinate)))
      if (template.template.coordinates.some((coordinate) => !boardKeys.has(coordinateKey(coordinate)))) errors.push('transformed board lost a required template anchor')
    }
    if (!isCeilingConnected(level)) errors.push('starting board is not ceiling-connected')
    const analysis = analyzeGeneratedBoard(level.gridConfig, level.startingBubbles)
    if (analysis.occupancyRatio < GENERATED_DENSITY_MIN || analysis.occupancyRatio > GENERATED_DENSITY_MAX + 1e-9) errors.push('intended region density is outside 92-100 percent')
    if (analysis.upperRowOccupancy < 1) errors.push('upper board occupancy is not full')
    if (analysis.occupiedRowCount < 7 || analysis.formationDepth < 7) errors.push('formation does not use enough board depth')
    if (analysis.formationWidth < 5.5) errors.push('formation is too narrow')
    if (analysis.largestEmptyCentralRegion > Math.max(2, Math.floor(analysis.intendedRegionCapacity * .05))) errors.push('central empty region is excessive')
    if (analysis.largestSameColorClusterSize > 8) errors.push('same-color composition contains an oversized connected cluster')
    if (hasTwoColumnStripeRegression(level)) errors.push('color composition regressed to two-column bands')
    if (!metricsMatch(level.generator.boardMetrics, analysis)) errors.push('board analysis metadata is stale')
    validateMissionConfiguration(level.mission)
    const objectives = normalizeMissionObjectives(level.mission)
    const markedCount = level.startingBubbles.filter((bubble) => bubble.marked === true).length
    if (markedCount > 0 && !objectives.some((objective) => objective.type === 'CLEAR_MARKED')) errors.push('marked bubbles require a CLEAR_MARKED objective')
    for (const objective of objectives) {
      if (objective.type === 'POP_COLOR' && objective.targetCount > analysis.colorCounts[objective.targetColor]) errors.push('POP_COLOR target exceeds available color bubbles')
      if (objective.type === 'DROP_BUBBLES' && (analysis.validatedDropOpportunity === 0 || objective.targetCount > analysis.validatedDropOpportunity)) errors.push('DROP_BUBBLES target exceeds validated drop opportunity')
      if (objective.type === 'CLEAR_MARKED' && objective.targetCount > markedCount) errors.push('CLEAR_MARKED target exceeds marked bubbles')
      if (objective.type === 'REACH_SCORE' && objective.targetScore > analysis.conservativeScoreFloor) errors.push('REACH_SCORE target exceeds conservative full-board score floor')
    }
    if (!missionCompletesOnBoardExhaustion(level.mission, analysis, markedCount)) errors.push('board exhaustion does not imply mandatory mission completion')
    if (objectives.length > 1 && combinedMissionEffort(level.mission) > level.shotLimit * 1.15) errors.push('mission-set combined effort exceeds shot allowance')
    if (!(level.starThresholds.one > 0 && level.starThresholds.one < level.starThresholds.two && level.starThresholds.two < level.starThresholds.three)) errors.push('star thresholds are not strictly increasing and positive')
    if (level.starThresholds.three > estimateScoreUpper(level)) errors.push('three-star threshold exceeds conservative score bound')
    if (level.generator.estimatedFloatingPotential !== estimateFloatingPotential(level)) errors.push('floating-potential metadata is stale')
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'generated level validation failed')
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors: Object.freeze(errors) }
}
