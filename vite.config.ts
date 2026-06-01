import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages project sites often live under /<repo>/.
  // Set BASE_PATH=/<repo>/ at build time so SPA assets resolve correctly.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
