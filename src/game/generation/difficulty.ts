import type { GeneratedDifficulty } from './types'

const DIFFICULTY_WAVE: readonly GeneratedDifficulty[] = ['easy', 'easy', 'medium', 'medium', 'hard', 'recovery', 'medium', 'hard', 'challenge', 'recovery']

export interface DifficultyProfile {
  readonly difficulty: GeneratedDifficulty
  readonly waveIndex: number
  readonly baselineTier: number
  readonly colorCount: number
  readonly densityFactor: number
  readonly missionComplexity: 1 | 2
}

export function getDifficultyProfile(levelId: number): DifficultyProfile {
  const relative = Math.max(0, levelId - 16)
  const waveIndex = relative % DIFFICULTY_WAVE.length
  const difficulty = DIFFICULTY_WAVE[waveIndex] ?? 'easy'
  const baselineTier = Math.min(4, Math.floor(relative / 1000))
  const colorCount = difficulty === 'challenge' || difficulty === 'hard' || baselineTier >= 3 ? 5 : 4
  const densityFactor = difficulty === 'easy' || difficulty === 'recovery' ? 0.55 : difficulty === 'medium' ? 0.68 : difficulty === 'hard' ? 0.78 : 0.86
  const missionComplexity: 1 | 2 = difficulty === 'challenge' && relative % 10 === 8 ? 2 : 1
  return { difficulty, waveIndex, baselineTier, colorCount, densityFactor, missionComplexity }
}

export function getDifficultyWave(): readonly GeneratedDifficulty[] {
  return DIFFICULTY_WAVE
}
