import { describe, expect, it } from 'vitest'

import { formatCompactCount } from './formatCount'

describe('formatCompactCount', () => {
  it('renders small values unchanged', () => {
    expect(formatCompactCount(0)).toBe('0')
    expect(formatCompactCount(7)).toBe('7')
    expect(formatCompactCount(999)).toBe('999')
  })

  it('abbreviates thousands', () => {
    expect(formatCompactCount(1000)).toBe('1K')
    expect(formatCompactCount(1234)).toBe('1.2K')
    expect(formatCompactCount(12345)).toBe('12.3K')
    expect(formatCompactCount(30000)).toBe('30K')
  })

  it('abbreviates millions and beyond', () => {
    expect(formatCompactCount(1_000_000)).toBe('1M')
    expect(formatCompactCount(2_500_000)).toBe('2.5M')
  })

  it('guards non-finite input', () => {
    expect(formatCompactCount(Number.NaN)).toBe('0')
    expect(formatCompactCount(Number.POSITIVE_INFINITY)).toBe('0')
  })
})
