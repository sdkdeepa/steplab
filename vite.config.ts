import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build` -> normal static site in dist/ (deploy to GitHub Pages, Netlify, etc.)
// `npm run build:single` -> one self-contained dist/index.html
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  test: { environment: 'node' },
}))
