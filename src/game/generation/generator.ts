import { DEFAULT_HEX_GRID_CONFIG } from '../grid/gridConfig'
import { normalizeMissionObjectives } from '../mission/missionRegistry'
import type { MissionConfiguration, MissionConfig } from '../mission/types'
import type { BubbleColor } from '../shooter/types'
import { getTemplate, TEMPLATE_REGISTRY } from '../templates/templateRegistry'
import type { TemplateDifficulty } from '../templates/types'
import { createSeededRandom } from '../../utils/seededRandom'
import { deriveGenerationSeed } from './seed'
import { estimateFloatingPotential, estimateScoreUpper, validateGeneratedLevel } from './validator'
import { getDifficultyProfile } from './difficulty'
import { FIRST_GENERATED_LEVEL_ID, GENERATOR_CONFIG_VERSION, GENERATOR_VERSION, MAX_GENERATED_SHOTS, MAX_GENERATION_RETRIES, MAX_SUPPORTED_LEVEL_ID, MIN_GENERATED_SHOTS } from './config'
import type { GeneratedLevelDefinition, GeneratedLevelResult } from './types'
import type { CuratedBubblePlacement, StarThresholds } from '../levels/types'
import { analyzeGeneratedBoard } from './analysis'
import { buildGeneratedBoardShape } from './boardBuilder'
import { composeBubbleColors, selectColorComposition } from './colorComposition'

const COLORS: readonly BubbleColor[] = ['blue', 'green', 'purple', 'red', 'yellow']
const rank: Record<TemplateDifficulty, number> = { easy: 0, medium: 1, hard: 2, challenge: 3 }

export interface GeneratorOptions { readonly maxRetries?: number; readonly candidateFactory?: (levelId: number, retryAttempt: number) => GeneratedLevelDefinition }

function shuffle<T>(values: readonly T[], rng: ReturnType<typeof createSeededRandom>): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = rng.integer(0, index + 1)
    const temporary = result[index]!
    result[index] = result[other]!
    result[other] = temporary
  }
  return result
}

function freezeMission(configuration: MissionConfiguration): MissionConfiguration {
  if (configuration.type === 'MISSION_SET') return Object.freeze({ type: 'MISSION_SET', objectives: Object.freeze(configuration.objectives.map((objective) => Object.freeze({ ...objective }))) })
  return Object.freeze({ ...configuration })
}

function selectTemplate(levelId: number, retry: number, difficulty: TemplateDifficulty | 'recovery') {
  const rng = createSeededRandom(`${deriveGenerationSeed(levelId, retry)}|template`)
  const target = difficulty === 'recovery' ? 1 : rank[difficulty]
  const suitable = TEMPLATE_REGISTRY.filter((template) => rank[template.difficulty] <= target + 1)
  return suitable[rng.integer(0, suitable.length)] ?? TEMPLATE_REGISTRY[0]!
}

function dominantColor(placements: readonly CuratedBubblePlacement[]): { color: BubbleColor; count: number } {
  const colors = new Map<BubbleColor, number>()
  for (const bubble of placements) colors.set(bubble.color, (colors.get(bubble.color) ?? 0) + 1)
  const entry = [...colors.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  return { color: entry?.[0] ?? 'blue', count: entry?.[1] ?? 1 }
}

function markPlacements(placements: CuratedBubblePlacement[], count: number, seed: string): number {
  const rng = createSeededRandom(`${seed}|marked`)
  const candidates = shuffle(placements.map((_, index) => index), rng).slice(0, Math.min(count, placements.length))
  for (const index of candidates) {
    const placement = placements[index]!
    placements[index] = { ...placement, marked: true }
  }
  return candidates.length
}

function missionFor(
  levelId: number,
  difficulty: ReturnType<typeof getDifficultyProfile>,
  placements: CuratedBubblePlacement[],
  analysis: ReturnType<typeof analyzeGeneratedBoard>,
  seed: string,
): MissionConfiguration {
  const mode = (levelId - FIRST_GENERATED_LEVEL_ID) % 10
  const dominant = dominantColor(placements)
  const pop: MissionConfig = {
    type: 'POP_COLOR',
    targetColor: dominant.color,
    targetCount: Math.max(1, Math.floor(dominant.count * (difficulty.difficulty === 'challenge' ? .72 : .62))),
  }
  const scoreFactor = difficulty.difficulty === 'challenge' ? .72 : difficulty.difficulty === 'hard' ? .66 : difficulty.difficulty === 'medium' ? .6 : .52
  const reach: MissionConfig = {
    type: 'REACH_SCORE',
    targetScore: Math.max(10, Math.floor(analysis.conservativeScoreFloor * scoreFactor)),
  }
  const drop: MissionConfig | null = analysis.validatedDropOpportunity > 0
    ? { type: 'DROP_BUBBLES', targetCount: Math.max(1, Math.min(analysis.validatedDropOpportunity, difficulty.difficulty === 'challenge' ? 3 : 2)) }
    : null
  const markedCount = Math.min(8, Math.max(4, Math.floor(placements.length * .1)))

  if (mode === 0 || mode === 6) return { type: 'CLEAR_ALL_BUBBLES' }
  if (mode === 1) return pop
  if (mode === 2) return drop ?? pop
  if (mode === 3 || mode === 8) {
    const count = markPlacements(placements, markedCount, seed)
    const marked: MissionConfig = { type: 'CLEAR_MARKED', targetCount: count }
    if (mode === 8 && difficulty.missionComplexity === 2) return { type: 'MISSION_SET', objectives: [pop, marked] }
    return marked
  }
  if (mode === 4 || mode === 9) return reach
  if (mode === 5 && difficulty.missionComplexity === 2) {
    return { type: 'MISSION_SET', objectives: drop === null ? [pop, reach] : [pop, drop] }
  }
  return pop
}

function missionEffort(configuration: MissionConfiguration): number {
  return normalizeMissionObjectives(configuration).reduce((effort, objective) => {
    if (objective.type === 'POP_COLOR') return effort + objective.targetCount / 3
    if (objective.type === 'DROP_BUBBLES') return effort + objective.targetCount * 1.5
    if (objective.type === 'CLEAR_MARKED') return effort + objective.targetCount / 2
    if (objective.type === 'REACH_SCORE') return effort + objective.targetScore / 60
    return effort
  }, 0)
}

function estimateShotLimit(
  profile: ReturnType<typeof getDifficultyProfile>,
  analysis: ReturnType<typeof analyzeGeneratedBoard>,
  paletteSize: number,
  mission: MissionConfiguration,
): number {
  const generosity = profile.difficulty === 'recovery' ? 10 : profile.difficulty === 'easy' ? 9 : profile.difficulty === 'medium' ? 7 : profile.difficulty === 'hard' ? 5 : 4
  const clusterPenalty = analysis.averageSameColorClusterSize < 2.2 ? 2 : 0
  const topologyEffort = analysis.formationDepth * .45 + (analysis.validatedDropOpportunity > 0 ? 1 : 2)
  const estimate = analysis.occupiedCellCount / 3 + paletteSize * .8 + topologyEffort + clusterPenalty + missionEffort(mission) + generosity
  return Math.max(MIN_GENERATED_SHOTS, Math.min(MAX_GENERATED_SHOTS, Math.round(estimate)))
}

function candidate(levelId: number, retryAttempt: number): GeneratedLevelDefinition {
  const profile = getDifficultyProfile(levelId)
  const seed = deriveGenerationSeed(levelId, retryAttempt)
  const rng = createSeededRandom(seed)
  const template = selectTemplate(levelId, retryAttempt, profile.difficulty)
  const inspection = getTemplate(template.id, DEFAULT_HEX_GRID_CONFIG)
  if (!inspection.ok) throw new Error(`Template ${template.id} unavailable.`)
  const palette = shuffle(COLORS, rng).slice(0, profile.colorCount).sort()
  const shape = buildGeneratedBoardShape(levelId, DEFAULT_HEX_GRID_CONFIG, inspection.template.coordinates, template.id, seed)
  const colorCompositionId = selectColorComposition(seed)
  const colors = composeBubbleColors(shape.coordinates, palette, colorCompositionId, DEFAULT_HEX_GRID_CONFIG, seed)
  const placements: CuratedBubblePlacement[] = shape.coordinates.map((coordinate) => ({
    coordinate: { ...coordinate },
    color: colors.get(`${coordinate.row}:${coordinate.column}`) ?? palette[0]!,
  }))
  let analysis = analyzeGeneratedBoard(DEFAULT_HEX_GRID_CONFIG, placements)
  const mission = missionFor(levelId, profile, placements, analysis, seed)
  analysis = analyzeGeneratedBoard(DEFAULT_HEX_GRID_CONFIG, placements)
  const shotLimit = estimateShotLimit(profile, analysis, palette.length, mission)
  const provisional = { startingBubbles: placements, shotLimit } as unknown as GeneratedLevelDefinition
  const upper = estimateScoreUpper(provisional)
  const one = Math.max(10, Math.floor(upper * .35))
  const two = Math.max(one + 1, Math.floor(upper * .55))
  const three = Math.max(two + 1, Math.floor(upper * .75))
  const thresholds: StarThresholds = { one, two, three }
  const boardMetrics = Object.freeze({
    validGridCapacity: analysis.validGridCapacity,
    intendedRegionCapacity: analysis.intendedRegionCapacity,
    occupiedCellCount: analysis.occupiedCellCount,
    occupancyRatio: analysis.occupancyRatio,
    occupiedRowCount: analysis.occupiedRowCount,
    upperRowOccupancy: analysis.upperRowOccupancy,
    largestEmptyCentralRegion: analysis.largestEmptyCentralRegion,
    formationWidth: analysis.formationWidth,
    formationDepth: analysis.formationDepth,
    averageSameColorClusterSize: analysis.averageSameColorClusterSize,
    largestSameColorClusterSize: analysis.largestSameColorClusterSize,
    validatedDropOpportunity: analysis.validatedDropOpportunity,
    conservativeScoreFloor: analysis.conservativeScoreFloor,
  })
  return Object.freeze({
    id: levelId,
    displayNumber: levelId,
    gridConfig: Object.freeze({ ...DEFAULT_HEX_GRID_CONFIG, origin: Object.freeze({ ...DEFAULT_HEX_GRID_CONFIG.origin }) }),
    allowedColors: Object.freeze(palette),
    shotLimit,
    mission: freezeMission(mission),
    startingBubbles: Object.freeze(placements.map((placement) => Object.freeze({ coordinate: Object.freeze({ ...placement.coordinate }), color: placement.color, ...(placement.marked ? { marked: true } : {}) }))),
    starThresholds: Object.freeze(thresholds),
    contentSource: 'generated' as const,
    onboardingBand: 'generated' as const,
    focus: `${profile.difficulty} generated ${template.name} / ${colorCompositionId}`,
    generator: Object.freeze({
      generatorVersion: GENERATOR_VERSION,
      generatorConfigVersion: GENERATOR_CONFIG_VERSION,
      retryAttempt,
      seed,
      difficulty: profile.difficulty,
      templateId: template.id,
      colorCompositionId,
      targetBubbleCount: shape.targetBubbleCount,
      estimatedFloatingPotential: estimateFloatingPotential(provisional),
      boardMetrics,
    }),
  })
}

export function generateGeneratedLevel(levelId: number, options: GeneratorOptions = {}): GeneratedLevelResult {
  if (!Number.isSafeInteger(levelId) || levelId < 1) return { ok: false, reason: 'invalid-level-id', attempts: 0, errors: [] }
  if (levelId < FIRST_GENERATED_LEVEL_ID || levelId > MAX_SUPPORTED_LEVEL_ID) return { ok: false, reason: 'unsupported-level-id', attempts: 0, errors: [] }
  const maxRetries = Math.max(0, Math.min(MAX_GENERATION_RETRIES, options.maxRetries ?? MAX_GENERATION_RETRIES))
  const errors: string[] = []
  for (let retry = 0; retry <= maxRetries; retry += 1) {
    try {
      const level = options.candidateFactory ? options.candidateFactory(levelId, retry) : candidate(levelId, retry)
      const validation = validateGeneratedLevel(level)
      if (validation.ok) return { ok: true, level }
      errors.push(...validation.errors.map((error) => `retry ${retry}: ${error}`))
    } catch (error) {
      errors.push(`retry ${retry}: ${error instanceof Error ? error.message : 'candidate failed'}`)
    }
  }
  return { ok: false, reason: 'generation-failed', attempts: maxRetries + 1, errors: Object.freeze(errors) }
}

