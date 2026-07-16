import { describe, expect, it } from 'vitest'
import { missionDisplay, starThresholdProgress } from './gameplayPresentation'

const base = { objectiveId: 'objective', progress: 1, target: 3, remaining: 2, completed: false, feasibility: { type: 'POP_COLOR' as const, requiresEvent: 'direct-or-floating-removal' as const } }

describe('player-facing gameplay presentation mapping', () => {
  it('maps every mission type without exposing internal enum names', () => {
    expect(missionDisplay({ ...base, type: 'CLEAR_ALL_BUBBLES', startingBubbleCount: 5, remainingBubbleCount: 2, clearedBubbleCount: 3 }).label).toBe('Clear All')
    expect(missionDisplay({ ...base, type: 'POP_COLOR', color: 'purple' }).label).toBe('Pop Purple')
    expect(missionDisplay({ ...base, type: 'DROP_BUBBLES' }).label).toBe('Drop Bubbles')
    expect(missionDisplay({ ...base, type: 'CLEAR_MARKED' }).label).toBe('Clear Targets')
    expect(missionDisplay({ ...base, type: 'REACH_SCORE', currentScore: 40, target: 100 }).label).toBe('Reach Score')
    expect(missionDisplay({ ...base, type: 'CLEAR_MARKED' }).label).not.toContain('CLEAR_')
  })

  it('presents objective progress as a countdown with a target bubble color', () => {
    const pop = missionDisplay({ ...base, type: 'POP_COLOR', color: 'red' })
    expect(pop.progress).toBe('2')
    expect(pop.bubbleColor).toBe('red')
    expect(missionDisplay({ ...base, type: 'DROP_BUBBLES' }).bubbleColor).toBe('green')
  })

  it('derives compact star progress from authoritative score thresholds', () => {
    expect(starThresholdProgress(49, { one: 50, two: 100, three: 150 })).toEqual([false, false, false])
    expect(starThresholdProgress(100, { one: 50, two: 100, three: 150 })).toEqual([true, true, false])
    expect(starThresholdProgress(150, { one: 50, two: 100, three: 150 })).toEqual([true, true, true])
  })
})
