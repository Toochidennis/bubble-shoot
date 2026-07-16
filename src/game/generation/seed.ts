import { GENERATOR_CONFIG_VERSION, GENERATOR_VERSION } from './config'

export function deriveGenerationSeed(levelId: number, retryAttempt = 0, generatorVersion = GENERATOR_VERSION, generatorConfigVersion = GENERATOR_CONFIG_VERSION): string {
  return `level:${levelId}|generator:${generatorVersion}|config:${generatorConfigVersion}|retry:${retryAttempt}`
}

export function deriveRetrySeed(levelId: number, retryAttempt: number): string {
  return deriveGenerationSeed(levelId, retryAttempt)
}
