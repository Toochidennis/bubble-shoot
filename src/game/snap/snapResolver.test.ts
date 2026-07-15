import { describe, expect, it } from 'vitest'

import { getCellCenter } from '../grid/coordinates'
import { HexBoard } from '../grid/HexBoard'
import { createHexGridConfig } from '../grid/gridConfig'
import type { GridCoordinate } from '../grid/types'
import type { ProjectileImpact } from '../physics/types'
import { getOccupiedBubbleColliders } from '../physics/collisionQueries'
import { createProjectile, stepProjectile } from '../physics/projectileStepper'
import type { BubbleDescriptor } from '../shooter/types'

import { getSnapCandidates, resolveSnapAndPlace } from './snapResolver'

const bubble: BubbleDescriptor = { color: 'purple' }
const config = createHexGridConfig({
  rowCount: 4,
  evenRowWidth: 4,
  oddRowWidth: 3,
  bubbleRadius: 10,
  origin: { x: 0, y: 0 },
})

function board(): HexBoard<BubbleDescriptor> {
  return new HexBoard<BubbleDescriptor>(config)
}

function ceilingImpact(position: { x: number; y: number }): ProjectileImpact {
  return {
    type: 'ceiling',
    position,
    direction: { x: 0, y: -1 },
    normal: { x: 0, y: 1 },
  }
}

function bubbleImpact(
  coordinate: GridCoordinate,
  position: { x: number; y: number },
  direction = { x: 0, y: -1 },
): ProjectileImpact {
  return {
    type: 'bubble',
    coordinate,
    position,
    direction,
    normal: { x: 0, y: 1 },
    bubbleCenter: getCellCenter(config, coordinate),
    bubble,
  }
}

function fillNeighborsExcept(
  targetBoard: HexBoard<BubbleDescriptor>,
  impacted: GridCoordinate,
  keep: GridCoordinate,
): void {
  for (const neighbor of targetBoard.getNeighbors(impacted)) {
    if (neighbor.row === keep.row && neighbor.column === keep.column) {
      continue
    }
    targetBoard.place(neighbor, { color: 'blue' })
  }
}

describe('ceiling-impact snapping', () => {
  it('selects the nearest empty top-row cell', () => {
    const targetBoard = board()
    const result = resolveSnapAndPlace(targetBoard, bubble, ceilingImpact({ x: 20, y: 0 }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.coordinate).toEqual({ row: 0, column: 1 })
      expect(result.center).toEqual(getCellCenter(config, result.coordinate))
    }
    expect(targetBoard.size).toBe(1)
  })

  it('uses stable row/column tie-breaking between equally near top cells', () => {
    const targetBoard = board()
    const result = resolveSnapAndPlace(targetBoard, bubble, ceilingImpact({ x: 30, y: 0 }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.coordinate).toEqual({ row: 0, column: 1 })
    }
  })

  it('excludes an occupied nearest top-row cell and chooses the next valid one', () => {
    const targetBoard = board()
    targetBoard.place({ row: 0, column: 1 }, { color: 'blue' })
    const result = resolveSnapAndPlace(targetBoard, bubble, ceilingImpact({ x: 20, y: 0 }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.coordinate).toEqual({ row: 0, column: 0 })
    }
    expect(targetBoard.getOccupancy({ row: 0, column: 1 })).toEqual({ color: 'blue' })
  })

  it('uses the nearest supported frontier when every top-row cell is occupied', () => {
    const targetBoard = board()
    for (let column = 0; column < config.evenRowWidth; column += 1) {
      targetBoard.place({ row: 0, column }, { color: 'blue' })
    }

    const result = resolveSnapAndPlace(targetBoard, bubble, ceilingImpact({ x: 20, y: 0 }))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.coordinate).toEqual({ row: 1, column: 0 })
      expect(targetBoard.getNeighbors(result.coordinate).some((cell) => targetBoard.isOccupied(cell))).toBe(true)
    }
    expect(targetBoard.size).toBe(config.evenRowWidth + 1)
  })

  it('fails explicitly only when the entire board has no legal empty cell', () => {
    const targetBoard = board()
    for (const cell of targetBoard.getValidCells()) {
      targetBoard.place(cell.coordinate, { color: 'blue' })
    }

    const before = targetBoard.size
    const result = resolveSnapAndPlace(targetBoard, bubble, ceilingImpact({ x: 20, y: 0 }))

    expect(result).toEqual({
      ok: false,
      reason: 'no-valid-candidate',
      impactType: 'ceiling',
      impactedCoordinate: undefined,
      candidates: [],
    })
    expect(targetBoard.size).toBe(before)
  })

  it('attaches a distant ceiling impact to the nearest legal edge cell', () => {
    const targetBoard = board()
    const result = resolveSnapAndPlace(targetBoard, bubble, ceilingImpact({ x: 500, y: 0 }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.coordinate).toEqual({ row: 0, column: config.evenRowWidth - 1 })
    }
    expect(targetBoard.size).toBe(1)
  })

  it('attaches far-left and far-right ceiling contacts to legal top-row cells', () => {
    const leftBoard = board()
    const leftResult = resolveSnapAndPlace(leftBoard, bubble, ceilingImpact({ x: -500, y: 0 }))
    const rightBoard = board()
    const rightResult = resolveSnapAndPlace(rightBoard, bubble, ceilingImpact({ x: 500, y: 0 }))

    expect(leftResult.ok && leftResult.coordinate).toEqual({ row: 0, column: 0 })
    expect(rightResult.ok && rightResult.coordinate).toEqual({ row: 0, column: config.evenRowWidth - 1 })
  })
})

describe('existing-bubble-impact snapping', () => {
  it('uses only an empty adjacent neighbor when other neighbors are blocked', () => {
    const targetBoard = board()
    const impacted = { row: 1, column: 1 }
    targetBoard.place(impacted, { color: 'blue' })
    const keep = { row: 0, column: 1 }
    fillNeighborsExcept(targetBoard, impacted, keep)

    const result = resolveSnapAndPlace(
      targetBoard,
      bubble,
      bubbleImpact(impacted, getCellCenter(config, keep), { x: 0, y: -1 }),
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.coordinate).toEqual(keep)
      expect(result.impactedCoordinate).toEqual(impacted)
    }
    expect(targetBoard.size).toBe(2 + targetBoard.getNeighbors(impacted).length - 1)
  })

  it('ranks contact from the left toward the left neighbor', () => {
    const targetBoard = board()
    const impacted = { row: 1, column: 1 }
    targetBoard.place(impacted, { color: 'blue' })
    const left = { row: 1, column: 0 }
    const result = resolveSnapAndPlace(
      targetBoard,
      bubble,
      bubbleImpact(impacted, { x: 20, y: getCellCenter(config, impacted).y }, { x: 1, y: 0 }),
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.coordinate).toEqual(left)
    }
  })

  it('ranks contact from the right toward the right neighbor', () => {
    const targetBoard = board()
    const impacted = { row: 1, column: 1 }
    targetBoard.place(impacted, { color: 'blue' })
    const right = { row: 1, column: 2 }
    const result = resolveSnapAndPlace(
      targetBoard,
      bubble,
      bubbleImpact(impacted, { x: 40, y: getCellCenter(config, impacted).y }, { x: -1, y: 0 }),
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.coordinate).toEqual(right)
    }
  })

  it('supports below-left and below-right contact geometry', () => {
    const impacted = { row: 1, column: 1 }
    const belowLeft = { row: 2, column: 1 }
    const belowRight = { row: 2, column: 2 }
    const leftBoard = board()
    leftBoard.place(impacted, { color: 'blue' })
    const leftResult = resolveSnapAndPlace(
      leftBoard,
      bubble,
      bubbleImpact(impacted, getCellCenter(config, belowLeft), { x: 0, y: -1 }),
    )
    const rightBoard = board()
    rightBoard.place(impacted, { color: 'blue' })
    const rightResult = resolveSnapAndPlace(
      rightBoard,
      bubble,
      bubbleImpact(impacted, getCellCenter(config, belowRight), { x: 0, y: -1 }),
    )

    expect(leftResult.ok && leftResult.coordinate).toEqual(belowLeft)
    expect(rightResult.ok && rightResult.coordinate).toEqual(belowRight)
  })

  it('excludes occupied neighbors and selects another primary neighbor', () => {
    const targetBoard = board()
    const impacted = { row: 1, column: 1 }
    const left = { row: 1, column: 0 }
    targetBoard.place(impacted, { color: 'blue' })
    targetBoard.place(left, { color: 'green' })

    const result = resolveSnapAndPlace(
      targetBoard,
      bubble,
      bubbleImpact(impacted, getCellCenter(config, left), { x: 1, y: 0 }),
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.coordinate).not.toEqual(left)
      expect(targetBoard.getOccupancy(result.coordinate)).toEqual(bubble)
    }
  })

  it('handles an edge impact using only valid neighbors', () => {
    const targetBoard = board()
    const impacted = { row: 0, column: 0 }
    targetBoard.place(impacted, { color: 'blue' })
    const candidates = getSnapCandidates(
      targetBoard,
      bubbleImpact(impacted, { x: 0, y: 0 }),
    )

    expect(candidates.candidates.every((candidate) => targetBoard.isValid(candidate.coordinate))).toBe(true)
    expect(candidates.candidates.every((candidate) => candidate.coordinate.row !== 0 || candidate.coordinate.column !== 0)).toBe(true)
  })

  it('uses the nearest supported frontier when the impacted bubble has no empty neighbors', () => {
    const targetBoard = board()
    const impacted = { row: 1, column: 1 }
    targetBoard.place(impacted, { color: 'blue' })
    for (const neighbor of targetBoard.getNeighbors(impacted)) {
      targetBoard.place(neighbor, { color: 'green' })
    }
    const before = targetBoard.size
    const result = resolveSnapAndPlace(targetBoard, bubble, bubbleImpact(impacted, { x: 30, y: 17 }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(targetBoard.getOccupancy(result.coordinate)).toEqual(bubble)
      expect(targetBoard.getNeighbors(result.coordinate).some((cell) => targetBoard.isOccupied(cell))).toBe(true)
    }
    expect(targetBoard.size).toBe(before + 1)
  })

  it('fails a blocked bubble impact only when the board is completely full', () => {
    const targetBoard = board()
    for (const cell of targetBoard.getValidCells()) {
      targetBoard.place(cell.coordinate, { color: 'blue' })
    }
    const impacted = { row: 1, column: 1 }
    const before = targetBoard.size
    const result = resolveSnapAndPlace(
      targetBoard,
      bubble,
      bubbleImpact(impacted, getCellCenter(config, impacted)),
    )

    expect(result).toMatchObject({ ok: false, reason: 'no-valid-candidate' })
    expect(targetBoard.size).toBe(before)
  })

  it('rejects an invalid or unsupported impact explicitly', () => {
    const targetBoard = board()
    const invalid: ProjectileImpact = {
      type: 'bubble',
      coordinate: { row: 99, column: 99 },
      position: { x: 0, y: 0 },
      direction: { x: 0, y: -1 },
      normal: { x: 0, y: 1 },
      bubble,
    }
    const safety: ProjectileImpact = {
      type: 'safety-limit',
      position: { x: 0, y: 0 },
      direction: { x: 0, y: -1 },
      normal: { x: 0, y: 1 },
    }

    const invalidResult = resolveSnapAndPlace(targetBoard, bubble, invalid)
    const safetyResult = resolveSnapAndPlace(targetBoard, bubble, safety)
    expect(invalidResult.ok).toBe(false)
    if (!invalidResult.ok) {
      expect(invalidResult.reason).toBe('invalid-impact-coordinate')
    }
    expect(safetyResult).toMatchObject({ ok: false, reason: 'unsupported-impact' })
    expect(targetBoard.size).toBe(0)
  })
})

describe('placement safety and determinism', () => {
  it('rejects invalid coordinates through the authoritative board API', () => {
    const targetBoard = board()
    expect(targetBoard.place({ row: 99, column: 99 }, bubble)).toEqual({
      ok: false,
      reason: 'invalid-coordinate',
    })
    expect(targetBoard.size).toBe(0)
  })

  it('consumes a Phase 4 ceiling impact at the snap boundary', () => {
    const targetBoard = board()
    const projectile = createProjectile({
      id: 'phase4-ceiling',
      bubble,
      origin: { x: 20, y: 100 },
      direction: { x: 0, y: -1 },
      config: { speed: 100, radius: 10, maxDeltaSeconds: 2, maxCollisionIterations: 8 },
    })
    const stepped = stepProjectile(
      projectile,
      2,
      { bounds: { leftWallX: 0, rightWallX: 100, topY: 0 }, bubbles: [] },
      { speed: 100, radius: 10, maxDeltaSeconds: 2, maxCollisionIterations: 8 },
    )

    expect(stepped.impact?.type).toBe('ceiling')
    if (stepped.impact === null) {
      return
    }
    const result = resolveSnapAndPlace(targetBoard, stepped.projectile.bubble, stepped.impact)
    expect(result.ok).toBe(true)
    expect(targetBoard.size).toBe(1)
  })

  it('consumes a Phase 4 occupied-bubble impact without removing the impacted bubble', () => {
    const targetBoard = board()
    const impacted = { row: 1, column: 1 }
    targetBoard.place(impacted, { color: 'blue' })
    const physicsConfig = {
      speed: 100,
      radius: 10,
      maxDeltaSeconds: 2,
      maxCollisionIterations: 8,
    }
    const projectile = createProjectile({
      id: 'phase4-bubble',
      bubble,
      origin: { x: 30, y: 100 },
      direction: { x: 0, y: -1 },
      config: physicsConfig,
    })
    const stepped = stepProjectile(
      projectile,
      2,
      {
        bounds: { leftWallX: 0, rightWallX: 100, topY: -100 },
        bubbles: getOccupiedBubbleColliders(targetBoard, 10),
      },
      physicsConfig,
    )

    expect(stepped.impact?.type).toBe('bubble')
    if (stepped.impact === null) {
      return
    }
    const result = resolveSnapAndPlace(targetBoard, stepped.projectile.bubble, stepped.impact)
    expect(result.ok).toBe(true)
    expect(targetBoard.getOccupancy(impacted)).toEqual({ color: 'blue' })
    expect(targetBoard.size).toBe(2)
  })

  it('writes exactly one entry and uses the authoritative center', () => {
    const targetBoard = board()
    const result = resolveSnapAndPlace(targetBoard, bubble, ceilingImpact({ x: 20, y: 0 }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.center).toEqual(getCellCenter(config, result.coordinate))
      expect(targetBoard.getOccupancy(result.coordinate)).toEqual(bubble)
    }
    expect(targetBoard.size).toBe(1)
  })

  it('is deterministic for identical board and impact inputs', () => {
    const firstBoard = board()
    const secondBoard = board()
    const impacted = { row: 1, column: 1 }
    firstBoard.place(impacted, { color: 'blue' })
    secondBoard.place(impacted, { color: 'blue' })
    const impact = bubbleImpact(impacted, { x: 30, y: 25 })

    const first = resolveSnapAndPlace(firstBoard, bubble, impact)
    const second = resolveSnapAndPlace(secondBoard, bubble, impact)
    expect(first).toEqual(second)
  })
})
