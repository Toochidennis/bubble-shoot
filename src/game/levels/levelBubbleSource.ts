import type { HexBoard } from '../grid/HexBoard'
import type { BubbleDescriptor, BubbleColor } from '../shooter/types'
import type { BubbleSource } from '../session/types'
import type { NormalizedLevelDefinition } from './types'

export class LevelBubbleSource implements BubbleSource {
  private index = 0

  public constructor(
    private readonly level: Pick<NormalizedLevelDefinition, 'id' | 'allowedColors'>,
    private readonly board: HexBoard<BubbleDescriptor>,
  ) {}

  public next(): BubbleDescriptor {
    const availableColors = this.level.allowedColors.filter((color) => this.isColorPresent(color))
    const pool = availableColors.length > 0 ? availableColors : this.level.allowedColors
    const color = pool[this.index % pool.length]
    this.index += 1
    if (color === undefined) {
      throw new Error(`Level ${this.level.id} has no bubble color source.`)
    }
    return { color }
  }

  public reset(): void {
    this.index = 0
  }

  private isColorPresent(color: BubbleColor): boolean {
    return this.board.getOccupiedCells().some((cell) => cell.value?.color === color)
  }
}
