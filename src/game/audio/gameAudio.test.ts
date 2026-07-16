import { describe, expect, it } from 'vitest'

import { GAME_AUDIO_DEFINITIONS } from './gameAudio'

describe('game audio mapping', () => {
  it('covers every player-facing sound event with local assets and bounded mix values', () => {
    const events = ['shot', 'wallBounce', 'bubblePop', 'matchBurst', 'dropBubble', 'uiClick', 'pause', 'win', 'lose'] as const
    for (const event of events) {
      const definition = GAME_AUDIO_DEFINITIONS[event]
      expect(definition.sources.length).toBeGreaterThan(0)
      expect(definition.sources.every((source) => source.startsWith('/audio/'))).toBe(true)
      expect(definition.volume).toBeGreaterThan(0)
      expect(definition.volume).toBeLessThanOrEqual(1)
      expect(definition.rate).toBeGreaterThan(0)
    }
  })

  it('keeps the power-up cue out of ordinary bubble matching', () => {
    expect(GAME_AUDIO_DEFINITIONS.bubblePop.sources.every((source) => !source.includes('powerUp7'))).toBe(true)
    expect(GAME_AUDIO_DEFINITIONS.matchBurst.sources.every((source) => !source.includes('powerUp7'))).toBe(true)
    expect(GAME_AUDIO_DEFINITIONS.win.sources).toContain('/audio/jingles-hit_08.ogg')
    expect(GAME_AUDIO_DEFINITIONS.win.sources).not.toContain('/audio/_originals/powerUp7.ogg')
  })
})
