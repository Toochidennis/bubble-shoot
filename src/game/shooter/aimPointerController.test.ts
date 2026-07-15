import { describe, expect, it } from 'vitest'

import { AimPointerController } from './aimPointerController'

describe('AimPointerController', () => {
  it('captures one pointer and ignores unrelated pointers', () => {
    const controller = new AimPointerController()
    expect(controller.begin(1)).toBe(true)
    expect(controller.begin(2)).toBe(false)
    expect(controller.accepts(1)).toBe(true)
    expect(controller.accepts(2)).toBe(false)
  })

  it('ends and cancels without allowing a second release to fire', () => {
    const controller = new AimPointerController()
    controller.begin(7)
    expect(controller.end(7)).toBe(true)
    expect(controller.end(7)).toBe(false)
    controller.begin(8)
    expect(controller.cancel(8)).toBe(true)
    expect(controller.accepts(8)).toBe(false)
  })
})
