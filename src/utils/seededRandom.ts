export interface SeededRandom {
  /** Returns a deterministic number in the range [0, 1). */
  next(): number
  /** Returns a deterministic integer in [minimum, maximumExclusive). */
  integer(minimum: number, maximumExclusive: number): number
}

const UINT32_RANGE = 0x1_0000_0000

function hashSeed(seed: string | number): number {
  const input = String(seed)
  let hash = 0x811c9dc5

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

/**
 * Creates an isolated deterministic pseudo-random stream.
 *
 * The same seed and call order always produce the same values. This utility
 * never calls Math.random(), wall-clock APIs, or browser-specific entropy.
 */
export function createSeededRandom(seed: string | number): SeededRandom {
  let state = hashSeed(seed)

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE
  }

  return {
    next,
    integer(minimum, maximumExclusive) {
      if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximumExclusive)) {
        throw new TypeError('Random integer bounds must be safe integers.')
      }

      if (maximumExclusive <= minimum) {
        throw new RangeError('maximumExclusive must be greater than minimum.')
      }

      return minimum + Math.floor(next() * (maximumExclusive - minimum))
    },
  }
}

