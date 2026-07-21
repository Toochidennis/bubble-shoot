import { type CSSProperties } from 'react'

import { HOME_AMBIENT_ELEMENTS } from './homeAmbient'

/**
 * The single deep-space backdrop shared by every menu screen — the original
 * floating-bubble "endless space" animation (glows + drifting bubbles + sparkle
 * + nebula), rendered once behind all screens so home and the level/map screen
 * share the identical living background.
 */
export function SpaceBackground() {
  return (
    <div className="space-background" aria-hidden="true">
      <div className="dashboard-ambient">
        <span className="ambient-glow ambient-glow--one" />
        <span className="ambient-glow ambient-glow--two" />
        {HOME_AMBIENT_ELEMENTS.map((bubble) => (
          <span
            key={`${bubble.left}-${bubble.top}`}
            className={`ambient-bubble ambient-bubble--${bubble.color} ambient-bubble--${bubble.depth}`}
            style={{ left: bubble.left, top: bubble.top, width: bubble.size, height: bubble.size, '--ambient-duration': bubble.duration, '--ambient-delay': bubble.delay, '--ambient-drift-x': bubble.driftX, '--ambient-drift-y': bubble.driftY, '--ambient-rotate': bubble.driftRotate, '--ambient-scale': bubble.driftScale, '--ambient-loop-in-x': bubble.loopInX, '--ambient-loop-in-y': bubble.loopInY, '--ambient-loop-out-x': bubble.loopOutX, '--ambient-loop-out-y': bubble.loopOutY } as CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
