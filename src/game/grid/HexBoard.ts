import {
  assertValidCoordinate,
  coordinateKey,
  getCellCenter,
  getRowWidth,
  isValidCoordinate,
} from './coordinates'
import type { HexGridConfig } from './gridConfig'
import { getNeighborCoordinates } from './neighbors'
import type {
  BoardMutationFailure,
  BoardMutationResult,
  GridCell,
  GridCoordinate,
} from './types'

export class HexBoard<T> {
  private readonly occupancy = new Map<string, T>()

  public constructor(public config: HexGridConfig) {}

  public get size(): number {
    return this.occupancy.size
  }

  /**
   * Shallow copy with identical occupancy — used by the headless shot solver to
   * try candidate shots without disturbing the authoritative board. Bubble
   * values are shared by reference (they are treated as immutable).
   */
  public clone(): HexBoard<T> {
    const copy = new HexBoard<T>(this.config)
    for (const [key, value] of this.occupancy) copy.occupancy.set(key, value)
    return copy
  }

  /**
   * Swaps in a grid config with identical row dimensions, re-centring/rescaling
   * the board to a new viewport without disturbing occupancy (which is keyed by
   * row/column, so cell centres are derived live from the config).
   */
  public relayout(config: HexGridConfig): void {
    if (
      config.rowCount !== this.config.rowCount ||
      config.evenRowWidth !== this.config.evenRowWidth ||
      config.oddRowWidth !== this.config.oddRowWidth
    ) {
      throw new RangeError('relayout requires identical grid dimensions to preserve occupancy.')
    }
    this.config = config
  }

  public isValid(coordinate: GridCoordinate): boolean {
    return isValidCoordinate(this.config, coordinate)
  }

  public getRowWidth(row: number): number {
    if (!Number.isSafeInteger(row) || row < 0 || row >= this.config.rowCount) {
      throw new RangeError(`Invalid hex-grid row ${row}.`)
    }

    return getRowWidth(this.config, row)
  }

  public isTopRow(coordinate: GridCoordinate): boolean {
    this.assertValid(coordinate)
    return coordinate.row === 0
  }

  public isOccupied(coordinate: GridCoordinate): boolean {
    this.assertValid(coordinate)
    return this.occupancy.has(coordinateKey(coordinate))
  }

  public getOccupancy(coordinate: GridCoordinate): T | undefined {
    this.assertValid(coordinate)
    return this.occupancy.get(coordinateKey(coordinate))
  }

  public place(
    coordinate: GridCoordinate,
    value: T,
  ): BoardMutationResult<undefined> {
    if (!this.isValid(coordinate)) {
      return { ok: false, reason: 'invalid-coordinate' }
    }

    const key = coordinateKey(coordinate)

    if (this.occupancy.has(key)) {
      return { ok: false, reason: 'occupied' }
    }

    this.occupancy.set(key, value)
    return { ok: true, value: undefined }
  }

  public remove(coordinate: GridCoordinate): BoardMutationResult<T | undefined> {
    if (!this.isValid(coordinate)) {
      return { ok: false, reason: 'invalid-coordinate' }
    }

    const key = coordinateKey(coordinate)
    const value = this.occupancy.get(key)
    this.occupancy.delete(key)
    return { ok: true, value }
  }

  public getValidCells(): GridCell<T>[] {
    const cells: GridCell<T>[] = []

    for (let row = 0; row < this.config.rowCount; row += 1) {
      for (let column = 0; column < getRowWidth(this.config, row); column += 1) {
        const coordinate = { row, column }
        const key = coordinateKey(coordinate)

        cells.push({
          coordinate,
          key,
          center: getCellCenter(this.config, coordinate),
          occupied: this.occupancy.has(key),
          value: this.occupancy.get(key),
        })
      }
    }

    return cells
  }

  public getOccupiedCells(): GridCell<T>[] {
    return this.getValidCells().filter((cell) => cell.occupied)
  }

  public getOccupiedTopRowCells(): GridCell<T>[] {
    return this.getValidCells().filter(
      (cell) => cell.occupied && cell.coordinate.row === 0,
    )
  }

  public getNeighbors(coordinate: GridCoordinate): GridCoordinate[] {
    this.assertValid(coordinate)
    return getNeighborCoordinates(this.config, coordinate)
  }

  public getNeighborCells(coordinate: GridCoordinate): GridCell<T>[] {
    return this.getNeighbors(coordinate).map((neighbor) => {
      const key = coordinateKey(neighbor)

      return {
        coordinate: neighbor,
        key,
        center: getCellCenter(this.config, neighbor),
        occupied: this.occupancy.has(key),
        value: this.occupancy.get(key),
      }
    })
  }

  private assertValid(coordinate: GridCoordinate): void {
    assertValidCoordinate(this.config, coordinate)
  }
}

export type { BoardMutationFailure }

