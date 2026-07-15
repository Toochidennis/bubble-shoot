import type { GridCoordinate } from '../grid/types'
import type { HexGridConfig } from '../grid/gridConfig'

export type TemplateDifficulty = 'easy' | 'medium' | 'hard' | 'challenge'
export type TemplateCeilingSupport = 'guaranteed' | 'requires-validation'
export type TemplateSymmetry = 'none' | 'horizontal' | 'vertical' | 'radial'

export interface TemplateDefinition {
  readonly id: string
  readonly name: string
  readonly difficulty: TemplateDifficulty
  readonly ceilingSupport: TemplateCeilingSupport
  readonly symmetry: TemplateSymmetry
  readonly densityGuidance: 'sparse' | 'balanced' | 'dense'
  readonly minimumRows: number
  readonly minimumEvenRowWidth: number
  readonly minimumOddRowWidth: number
  readonly createCoordinates: (config: HexGridConfig) => readonly GridCoordinate[]
}

export interface TemplateInspection {
  readonly id: string
  readonly name: string
  readonly difficulty: TemplateDifficulty
  readonly ceilingSupport: TemplateCeilingSupport
  readonly symmetry: TemplateSymmetry
  readonly densityGuidance: 'sparse' | 'balanced' | 'dense'
  readonly coordinates: readonly GridCoordinate[]
}

export type TemplateAccessResult =
  | { readonly ok: true; readonly template: TemplateInspection }
  | { readonly ok: false; readonly reason: 'unknown-template' | 'unsupported-configuration' }
