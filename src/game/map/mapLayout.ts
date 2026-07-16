export interface MapLayoutConfig {
  readonly nodeStride: number
  readonly horizontalAmplitude: number
  readonly cap: number
}

export interface MapNodeLayout {
  readonly levelId: number
  readonly y: number
  /** Horizontal offset from the center in normalized [-1, 1] units. */
  readonly x: number
}

export const DEFAULT_MAP_LAYOUT: MapLayoutConfig = Object.freeze({
  nodeStride: 118,
  horizontalAmplitude: 0.36,
  cap: 10_000,
})

export function getMapNodeLayout(levelId: number, config: MapLayoutConfig = DEFAULT_MAP_LAYOUT): MapNodeLayout {
  if (!Number.isSafeInteger(levelId) || levelId < 1 || levelId > config.cap) throw new RangeError(`Invalid map level ${levelId}.`)
  const phase = (levelId - 1) % 8
  const wave = [0.03, 0.33, 0.18, -0.22, -0.34, -0.12, 0.24, 0.35][phase] ?? 0
  return { levelId, y: (levelId - 1) * config.nodeStride + 64, x: wave }
}

export function getMapContentHeight(config: MapLayoutConfig = DEFAULT_MAP_LAYOUT): number {
  return config.cap * config.nodeStride + 128
}

export interface VisibleLevelRange { readonly start: number; readonly end: number }

export function getVisibleLevelRange(scrollTop: number, viewportHeight: number, config: MapLayoutConfig = DEFAULT_MAP_LAYOUT, overscan = 4): VisibleLevelRange {
  const safeScroll = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0
  const safeHeight = Number.isFinite(viewportHeight) ? Math.max(0, viewportHeight) : 0
  const start = Math.max(1, Math.floor((safeScroll - 64) / config.nodeStride) + 1 - overscan)
  const end = Math.min(config.cap, Math.ceil((safeScroll + safeHeight - 64) / config.nodeStride) + 1 + overscan)
  return { start: Math.min(start, config.cap), end: Math.max(Math.min(end, config.cap), Math.min(start, config.cap)) }
}

export function getMapFocusScrollTop(levelId: number, viewportHeight: number, config: MapLayoutConfig = DEFAULT_MAP_LAYOUT): number {
  const node = getMapNodeLayout(Math.min(Math.max(1, levelId), config.cap), config)
  return Math.max(0, node.y - Math.max(0, viewportHeight) * 0.42)
}
