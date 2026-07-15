import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { AppErrorBoundary } from './app/AppErrorBoundary'
import './styles/global.css'

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

