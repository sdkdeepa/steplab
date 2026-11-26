/**
 * StepLab as an installable, offline-capable app, on desktop only.
 *
 * - Desktop browsers get the app manifest and the service worker. Phones and tablets
 *   don't: they keep using StepLab as a normal website.
 * - The service worker caches the app itself (pages, code, styles, fonts, built-in labs),
 *   never the user's files. Those still never leave their computer.
 * - When a new version is published, StepLab offers "Reload" and then removes the old cache.
 *   It also checks for a new version when the network comes back, and every hour.
 * - Safety switch for users: open StepLab with ?reset to remove the service worker and
 *   every cache, then load fresh. (The maintainer's switch is in vite.config.ts.)
 */

type Listener = () => void

export interface PwaState {
  /** A new version is downloaded and waiting for a reload. */
  updateReady: boolean
  /** The app is cached and works offline (shown once). */
  offlineReady: boolean
  /** The browser offered to install StepLab (Chrome and Edge on desktop). */
  canInstall: boolean
  online: boolean
}

let state: PwaState = { updateReady: false, offlineReady: false, canInstall: false, online: navigator.onLine }
const listeners = new Set<Listener>()
const set = (patch: Partial<PwaState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export const pwaState = () => state
export function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}

let applyUpdate: (() => Promise<void>) | null = null
let installEvent: (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null = null

/** Reloads into the new version. */
export const reloadToUpdate = () => applyUpdate?.()
export const dismissOfflineReady = () => set({ offlineReady: false })
export const dismissUpdate = () => set({ updateReady: false })

export async function install() {
  if (!installEvent) return
  await installEvent.prompt()
  await installEvent.userChoice
  installEvent = null
  set({ canInstall: false })
}

/** A computer with a mouse or trackpad, not a phone or tablet. Window width doesn't matter. */
export function isDesktop(): boolean {
  const ua = navigator.userAgent
  const mobileHint = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile
  if (mobileHint === true || /Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return false
  return matchMedia('(hover: hover) and (pointer: fine)').matches
}

/** Removes StepLab's service worker and every cache in this browser. */
async function removeApp() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? []
    await Promise.all(regs.map((r) => r.unregister()))
    if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
  } catch {
    /* nothing to remove */
  }
}

/** ?reset: remove StepLab's service worker and caches, then load fresh. Returns true if it is resetting. */
export async function resetIfAsked(): Promise<boolean> {
  const url = new URL(location.href)
  if (!url.searchParams.has('reset')) return false
  await removeApp()
  url.searchParams.delete('reset')
  location.replace(url.toString())
  return true
}

function addHeadLink(rel: string, href: string) {
  const link = document.createElement('link')
  link.rel = rel
  link.href = href
  document.head.append(link)
}

/** Turns on the app features on desktop. Elsewhere, removes a service worker left from before. */
export async function setupPwa() {
  window.addEventListener('online', () => set({ online: true }))
  window.addEventListener('offline', () => set({ online: false }))
  if (!('serviceWorker' in navigator) || import.meta.env.DEV || import.meta.env.MODE === 'single') return

  // Safety switch on (STEPLAB_PWA=off), or not a desktop: make sure nothing is left from before.
  if (import.meta.env.STEPLAB_PWA_OFF || !isDesktop()) {
    await removeApp()
    return
  }

  addHeadLink('manifest', `${import.meta.env.BASE_URL}manifest.webmanifest`)
  addHeadLink('apple-touch-icon', `${import.meta.env.BASE_URL}pwa/apple-touch-icon.png`)

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installEvent = e as typeof installEvent
    set({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => set({ canInstall: false }))

  const { registerSW } = await import('virtual:pwa-register')
  const update = registerSW({
    onNeedRefresh: () => set({ updateReady: true }),
    onOfflineReady: () => set({ offlineReady: true }),
    onRegisteredSW(_url: string, reg: ServiceWorkerRegistration | undefined) {
      if (!reg) return
      const check = () => navigator.onLine && reg.update().catch(() => {})
      window.addEventListener('online', check)
      setInterval(check, 60 * 60 * 1000)
    },
  })
  applyUpdate = () => update(true)
}
