import { describe, expect, it } from 'vitest'

import { calculateCanvasMetrics } from './canvasMetrics'

describe('calculateCanvasMetrics', () => {
  it('uses measured CSS dimensions as logical coordinates', () => {
    expect(calculateCanvasMetrics(390, 640, 1, 2)).toEqual({
      width: 390,
      height: 640,
      logicalWidth: 390,
      logicalHeight: 640,
      backingWidth: 390,
      backingHeight: 640,
      pixelRatio: 1,
    })
  })

  it('caps high-density backing storage', () => {
    expect(calculateCanvasMetrics(390, 640, 3, 2)).toMatchObject({
      backingWidth: 780,
      backingHeight: 1280,
      pixelRatio: 2,
    })
  })
})

