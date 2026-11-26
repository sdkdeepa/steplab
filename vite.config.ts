import { defineConfig, type Plugin } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'
import { STEPLAB_URL } from './src/config.ts'

// Fills %STEPLAB_URL% in index.html (share-preview tags) from src/config.ts,
// so a fork changes its site address in one place.
function siteUrl(): Plugin {
  const url = STEPLAB_URL.endsWith('/') ? STEPLAB_URL : `${STEPLAB_URL}/`
  return { name: 'steplab-site-url', transformIndexHtml: (html) => html.replaceAll('%STEPLAB_URL%', url) }
}

// The desktop app (PWA): a service worker that caches StepLab itself so it works offline.
// src/lib/pwa.ts turns it on for desktop browsers only, and offers "Reload" for new versions.
//
// MAINTAINER SAFETY SWITCH: if a release ever leaves people stuck on a broken version, build
// and deploy with STEPLAB_PWA=off. That publishes a service worker that removes itself and
// every StepLab cache from everyone's browser on their next visit. Turn it back on later by
// deploying without the setting. (Users can also open StepLab with ?reset.)
function pwa(): Plugin[] {
  return VitePWA({
    selfDestroying: process.env.STEPLAB_PWA === 'off',
    registerType: 'prompt',
    injectRegister: false, // src/lib/pwa.ts registers it, on desktop only
    manifest: false, // public/manifest.webmanifest, linked by src/lib/pwa.ts on desktop only
    workbox: {
      // The app itself, plus the Latin fonts (~190 KB) so it looks right offline from the start.
      // Other language subsets of the fonts are cached the first time they're used (below).
      globPatterns: ['**/*.{html,js,css,svg,png,md,webmanifest}', 'assets/*-latin-[0-9]*-normal-*.woff2'],
      globIgnores: ['og-image.png', '404.html'],
      navigateFallback: 'index.html', // /format, /sample, /sample-template work offline
      cleanupOutdatedCaches: true, // a new version removes the old version's cache
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      runtimeCaching: [
        {
          urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.woff2?$/.test(url.pathname),
          handler: 'CacheFirst',
          options: { cacheName: 'steplab-fonts', expiration: { maxEntries: 40 } },
        },
      ],
    },
  })
}

// The one-file build has no service worker: src/lib/pwa.ts skips it, and this stands in for the module.
function noPwa(): Plugin {
  const id = 'virtual:pwa-register'
  return {
    name: 'steplab-no-pwa',
    resolveId: (source) => (source === id ? '\0' + id : null),
    load: (key) => (key === '\0' + id ? 'export const registerSW = () => async () => {}' : null),
  }
}

// `npm run build` -> normal static site in dist/ (deploy to GitHub Pages, Netlify, etc.)
// `npm run build:single` -> one self-contained dist/index.html
export default defineConfig(({ mode }) => ({
  base: './',
  // Read by src/lib/pwa.ts: with the safety switch on, the app removes the service worker instead of registering it.
  define: { 'import.meta.env.STEPLAB_PWA_OFF': JSON.stringify(process.env.STEPLAB_PWA === 'off') },
  plugins: [react(), siteUrl(), ...(mode === 'single' ? [viteSingleFile(), noPwa()] : pwa())],
  // e2e/ holds the Playwright tests (npm run test:e2e), not Vitest ones.
  test: { environment: 'node', exclude: [...configDefaults.exclude, 'e2e/**'] },
}))