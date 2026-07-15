import type { LogicalViewport, Point2D } from '../../types/foundation'

import { DEFAULT_AIM_LIMITS } from './aimMath'
import type { BubbleDescriptor, ShooterConfig } from './types'

export const DEFAULT_SHOOTER_BOTTOM_INSET = 72
export const DEFAULT_CURRENT_BUBBLE: BubbleDescriptor = { color: 'purple' }
export const DEFAULT_NEXT_BUBBLE: BubbleDescriptor = { color: 'yellow' }

export function createDefaultShooterConfig(
  viewport: LogicalViewport,
): ShooterConfig {
  return {
    viewport,
    bottomInset: DEFAULT_SHOOTER_BOTTOM_INSET,
    aimLimits: DEFAULT_AIM_LIMITS,
    currentBubble: DEFAULT_CURRENT_BUBBLE,
    nextBubble: DEFAULT_NEXT_BUBBLE,
  }
}

export function getShooterOrigin(
  viewport: LogicalViewport,
  bottomInset: number,
): Point2D {
  if (!Number.isFinite(bottomInset) || bottomInset < 0) {
    throw new RangeError('bottomInset must be a finite number of zero or greater.')
  }

  return {
    x: viewport.width / 2,
    y: Math.max(0, viewport.height - bottomInset),
  }
}

