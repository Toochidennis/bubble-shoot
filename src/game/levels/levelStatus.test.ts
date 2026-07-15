import { describe, expect, it } from 'vitest'

import { evaluateLevelStatus } from './types'
import type { MissionProgress } from '../mission/types'

const progress = (completed: boolean): MissionProgress => ({
  type: 'CLEAR_ALL_BUBBLES',
  startingBubbleCount: 5,
  remainingBubbleCount: completed ? 0 : 2,
  clearedBubbleCount: completed ? 5 : 3,
  completed,
})

describe('curated level win/loss ordering', () => {
  it('wins when the final shot clears the board before checking exhaustion', () => {
    expect(evaluateLevelStatus(progress(true), 0)).toBe('WON')
  })

  it('loses only after a resolved turn leaves bubbles and zero shots', () => {
    expect(evaluateLevelStatus(progress(false), 0)).toBe('LOST')
    expect(evaluateLevelStatus(progress(false), 1)).toBe('ACTIVE')
  })
})
