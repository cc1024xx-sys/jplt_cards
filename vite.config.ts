import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub Pages serves 404.html for unknown paths; copy index.html so the SPA can boot. */
function spaFallback404(): Plugin {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const indexPath = join(process.cwd(), 'dist', 'index.html')
      copyFileSync(indexPath, join(process.cwd(), 'dist', '404.html'))
    },
  }
}

export default defineConfig({
  // GitHub Pages project sites often live under /<repo>/.
  // Set BASE_PATH=/<repo>/ at build time so SPA assets resolve correctly.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), spaFallback404()],
})
