function getCanvasPixelRatioCap(): number {
  if (typeof navigator === 'undefined') return 1.5
  const profile = navigator as Navigator & { readonly deviceMemory?: number }
  const lowMemory = typeof profile.deviceMemory === 'number' && profile.deviceMemory <= 4
  const fewCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4
  return lowMemory || fewCores ? 1.25 : 1.75
}

export const APP_CONFIG = Object.freeze({
  canvas: Object.freeze({
    maxDevicePixelRatio: getCanvasPixelRatioCap(),
  }),
  development: Object.freeze({
    showCanvasDiagnostics: import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug'),
  }),
})
