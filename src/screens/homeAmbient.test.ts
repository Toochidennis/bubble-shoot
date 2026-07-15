import { describe, expect, it } from 'vitest'

import { HOME_AMBIENT_ELEMENTS, homeAmbientMotionProfile } from './homeAmbient'

describe('Home ambient presentation metadata', () => {
  it('reuses exactly the bounded existing decorative orb set', () => {
    expect(HOME_AMBIENT_ELEMENTS).toHaveLength(6)
    expect(new Set(HOME_AMBIENT_ELEMENTS.map((element) => element.color))).toEqual(new Set(['violet', 'blue', 'pink', 'cyan', 'purple', 'gold']))
    expect(HOME_AMBIENT_ELEMENTS.every((element) => element.duration.endsWith('s') && element.delay.endsWith('s'))).toBe(true)
  })

  it('uses deterministic slower motion for deeper layers', () => {
    expect(homeAmbientMotionProfile('near').durationSeconds).toBeLessThan(homeAmbientMotionProfile('mid').durationSeconds)
    expect(homeAmbientMotionProfile('mid').durationSeconds).toBeLessThan(homeAmbientMotionProfile('far').durationSeconds)
    expect(homeAmbientMotionProfile('far').opacity).toBeLessThan(homeAmbientMotionProfile('near').opacity)
  })
})
