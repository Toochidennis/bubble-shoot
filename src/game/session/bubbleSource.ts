import type { BubbleDescriptor } from '../shooter/types'
import type { BubbleSource } from './types'

export class DeterministicBubbleSource implements BubbleSource {
  private index = 0

  public constructor(private readonly sequence: readonly BubbleDescriptor[]) {
    if (sequence.length === 0) {
      throw new RangeError('Bubble source sequence must not be empty.')
    }
  }

  public next(): BubbleDescriptor {
    const bubble = this.sequence[this.index % this.sequence.length]
    this.index += 1
    if (bubble === undefined) {
      throw new Error('Bubble source sequence returned no bubble.')
    }
    return bubble
  }
}

export const DEFAULT_DEVELOPMENT_BUBBLE_SOURCE = new DeterministicBubbleSource([
  { color: 'blue' },
  { color: 'green' },
  { color: 'purple' },
  { color: 'red' },
  { color: 'yellow' },
])
