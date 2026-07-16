export const APP_CONFIG = Object.freeze({
  canvas: Object.freeze({
    maxDevicePixelRatio: 2,
  }),
  development: Object.freeze({
    showCanvasDiagnostics: import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug'),
  }),
})
