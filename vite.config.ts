import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { STEPLAB_URL } from './src/config.ts'

// Fills %STEPLAB_URL% in index.html (share-preview tags) from src/config.ts,
// so a fork changes its site address in one place.
function siteUrl(): Plugin {
  const url = STEPLAB_URL.endsWith('/') ? STEPLAB_URL : `${STEPLAB_URL}/`
  return { name: 'steplab-site-url', transformIndexHtml: (html) => html.replaceAll('%STEPLAB_URL%', url) }
}

// `npm run build` -> normal static site in dist/ (deploy to GitHub Pages, Netlify, etc.)
// `npm run build:single` -> one self-contained dist/index.html
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), siteUrl(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  test: { environment: 'node' },
}))