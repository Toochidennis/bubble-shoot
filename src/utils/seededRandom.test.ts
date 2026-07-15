import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSeededRandom } from './seededRandom'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createSeededRandom', () => {
  it('produces identical streams for the same seed', () => {
    const first = createSeededRandom('level:101:v1')
    const second = createSeededRandom('level:101:v1')

    const firstValues = Array.from({ length: 8 }, () => first.next())
    const secondValues = Array.from({ length: 8 }, () => second.next())

    expect(firstValues).toEqual(secondValues)
  })

  it('produces a stable regression sequence', () => {
    const random = createSeededRandom('bubble-shooter')

    expect(Array.from({ length: 4 }, () => random.next())).toEqual([
      0.04040459799580276,
      0.8510343397501856,
      0.32239496195688844,
      0.022797441808506846,
    ])
  })

  it('does not depend on Math.random', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be called')
    })

    expect(createSeededRandom(42).integer(2, 7)).toBeGreaterThanOrEqual(2)
  })

  it('validates integer bounds', () => {
    const random = createSeededRandom('bounds')

    expect(() => random.integer(3, 3)).toThrow(RangeError)
    expect(() => random.integer(0.5, 2)).toThrow(TypeError)
  })
})
