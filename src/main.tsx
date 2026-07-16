import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { AppErrorBoundary } from './app/AppErrorBoundary'
import './styles/global.css'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // PWA support is progressive; gameplay remains available if registration fails.
    })
  })
}

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Unable to start Bubble Shooter: root element was not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
