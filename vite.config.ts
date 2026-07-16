import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // The catalog is production-backed and the project intentionally keeps its
  // API configuration in `.env.production`. Reuse those values when running
  // the local Vite server so profile country/language catalogs behave the same
  // way in development and in the production preview.
  const productionEnv = loadEnv('production', process.cwd(), '')
  const developmentCatalogEnv = mode === 'development'
    ? {
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(productionEnv.VITE_API_BASE_URL),
        'import.meta.env.VITE_API_KEY': JSON.stringify(productionEnv.VITE_API_KEY),
      }
    : undefined

  return {
    plugins: [react()],
    define: developmentCatalogEnv,
    server: {
      host: '127.0.0.1',
    },
    preview: {
      host: '127.0.0.1',
    },
  }
})
