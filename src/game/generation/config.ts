export const GENERATOR_VERSION = 1 as const
export const GENERATOR_CONFIG_VERSION = 5 as const
export const MIN_SUPPORTED_LEVEL_ID = 1 as const
export const FIRST_GENERATED_LEVEL_ID = 16 as const
export const MAX_SUPPORTED_LEVEL_ID = 10_000 as const
export const MAX_GENERATION_RETRIES = 3 as const
export const MIN_GENERATED_SHOTS = 8 as const
export const MAX_GENERATED_SHOTS = 96 as const
export const GENERATED_DENSITY_MIN = 0.92
export const GENERATED_DENSITY_MAX = 1

export function isSupportedLevelId(levelId: number): boolean {
  return Number.isSafeInteger(levelId) && levelId >= MIN_SUPPORTED_LEVEL_ID && levelId <= MAX_SUPPORTED_LEVEL_ID
}

export function isGeneratedLevelId(levelId: number): boolean {
  return Number.isSafeInteger(levelId) && levelId >= FIRST_GENERATED_LEVEL_ID && levelId <= MAX_SUPPORTED_LEVEL_ID
}
