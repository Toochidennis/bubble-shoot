import { describe, expect, it } from 'vitest'

import { clientPointToLogicalPoint } from './pointerInput'

describe('pointer coordinate conversion', () => {
  it('maps CSS-scaled coordinates into logical Canvas space', () => {
    expect(
      clientPointToLogicalPoint(
        { clientX: 400, clientY: 800 },
        { left: 10, top: 20, width: 780, height: 1560 },
        { width: 390, height: 780, pixelRatio: 2 },
      ),
    ).toEqual({ x: 195, y: 390 })
  })

  it('does not apply DPR a second time', () => {
    const logical = clientPointToLogicalPoint(
      { clientX: 210, clientY: 220 },
      { left: 10, top: 20, width: 400, height: 400 },
      { width: 200, height: 200, pixelRatio: 3 },
    )

    expect(logical).toEqual({ x: 100, y: 100 })
  })

  it('rejects unusable Canvas rectangles', () => {
    expect(() =>
      clientPointToLogicalPoint(
        { clientX: 0, clientY: 0 },
        { left: 0, top: 0, width: 0, height: 100 },
        { width: 100, height: 100, pixelRatio: 1 },
      ),
    ).toThrow(RangeError)
  })
})

