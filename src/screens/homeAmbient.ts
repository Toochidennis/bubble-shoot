export type HomeAmbientDepth = 'far' | 'mid' | 'near'

export interface HomeAmbientElement {
  readonly left: string
  readonly top: string
  readonly size: number
  readonly color: 'violet' | 'blue' | 'pink' | 'cyan' | 'purple' | 'gold'
  readonly duration: string
  readonly delay: string
  readonly depth: HomeAmbientDepth
}

/** The existing six decorative Home orbs, expressed as deterministic motion metadata. */
export const HOME_AMBIENT_ELEMENTS: readonly HomeAmbientElement[] = Object.freeze([
  { left: '5%', top: '18%', size: 88, color: 'violet', duration: '22s', delay: '-7s', depth: 'near' },
  { left: '79%', top: '22%', size: 42, color: 'blue', duration: '34s', delay: '-16s', depth: 'mid' },
  { left: '88%', top: '54%', size: 120, color: 'pink', duration: '18s', delay: '-11s', depth: 'near' },
  { left: '12%', top: '72%', size: 58, color: 'cyan', duration: '29s', delay: '-20s', depth: 'mid' },
  { left: '70%', top: '80%', size: 68, color: 'purple', duration: '38s', delay: '-4s', depth: 'mid' },
  { left: '38%', top: '46%', size: 24, color: 'gold', duration: '46s', delay: '-27s', depth: 'far' },
])

export function homeAmbientMotionProfile(depth: HomeAmbientDepth): { readonly durationSeconds: number; readonly opacity: number } {
  if (depth === 'near') return { durationSeconds: 20, opacity: .36 }
  if (depth === 'mid') return { durationSeconds: 32, opacity: .28 }
  return { durationSeconds: 46, opacity: .2 }
}
