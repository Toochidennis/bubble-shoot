export type HomeAmbientDepth = 'far' | 'mid' | 'near'

export interface HomeAmbientElement {
  readonly left: string
  readonly top: string
  readonly size: number
  readonly color: 'violet' | 'blue' | 'pink' | 'cyan' | 'purple' | 'gold'
  readonly duration: string
  readonly delay: string
  readonly depth: HomeAmbientDepth
  readonly driftX: string
  readonly driftY: string
  readonly driftRotate: string
  readonly driftScale: number
  readonly loopInX: string
  readonly loopInY: string
  readonly loopOutX: string
  readonly loopOutY: string
}

/** Six deterministic orbs that continuously cross the playfield and re-enter from its edges. */
export const HOME_AMBIENT_ELEMENTS: readonly HomeAmbientElement[] = Object.freeze([
  { left: '5%', top: '18%', size: 88, color: 'violet', duration: '56s', delay: '-9s', depth: 'near', driftX: '16px', driftY: '-24px', driftRotate: '3deg', driftScale: .025, loopInX: '-110vw', loopInY: '18vh', loopOutX: '110vw', loopOutY: '-22vh' },
  { left: '79%', top: '22%', size: 42, color: 'blue', duration: '72s', delay: '-17s', depth: 'mid', driftX: '-12px', driftY: '18px', driftRotate: '-2deg', driftScale: .018, loopInX: '120vw', loopInY: '-16vh', loopOutX: '-120vw', loopOutY: '26vh' },
  { left: '88%', top: '54%', size: 120, color: 'pink', duration: '48s', delay: '-13s', depth: 'near', driftX: '20px', driftY: '14px', driftRotate: '2deg', driftScale: .03, loopInX: '125vw', loopInY: '24vh', loopOutX: '-125vw', loopOutY: '-18vh' },
  { left: '12%', top: '72%', size: 58, color: 'cyan', duration: '68s', delay: '-25s', depth: 'mid', driftX: '-15px', driftY: '-18px', driftRotate: '-2deg', driftScale: .02, loopInX: '-118vw', loopInY: '-20vh', loopOutX: '118vw', loopOutY: '14vh' },
  { left: '70%', top: '80%', size: 68, color: 'purple', duration: '84s', delay: '-6s', depth: 'mid', driftX: '10px', driftY: '22px', driftRotate: '2deg', driftScale: .02, loopInX: '115vw', loopInY: '12vh', loopOutX: '-115vw', loopOutY: '-28vh' },
  { left: '38%', top: '46%', size: 24, color: 'gold', duration: '92s', delay: '-31s', depth: 'far', driftX: '-8px', driftY: '-12px', driftRotate: '-3deg', driftScale: .015, loopInX: '-105vw', loopInY: '-12vh', loopOutX: '105vw', loopOutY: '20vh' },
])

export function homeAmbientMotionProfile(depth: HomeAmbientDepth): { readonly durationSeconds: number; readonly opacity: number } {
  if (depth === 'near') return { durationSeconds: 30, opacity: .36 }
  if (depth === 'mid') return { durationSeconds: 46, opacity: .28 }
  return { durationSeconds: 64, opacity: .2 }
}
