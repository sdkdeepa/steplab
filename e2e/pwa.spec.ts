import { test, expect, devices, type Page } from '@playwright/test'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The desktop app (PWA): offline use, new-version prompt, ?reset, and phones left alone.
// Runs in its own Playwright project after the main tests (see playwright.config.ts),
// one test at a time, because the update test changes the built service worker.
test.describe.configure({ mode: 'serial' })

const SW_FILE = fileURLToPath(new URL('../dist/sw.js', import.meta.url))
const BASIC_LAB = fileURLToPath(new URL('./fixtures/basic-lab.md', import.meta.url))

/** Waits until the service worker is installed and in control of the page. */
async function waitForApp(page: Page) {
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
}

/** Pretends the browser offered to install the app (browsers decide when; tests can't wait for that). */
async function offerInstall(page: Page) {
  await page.evaluate(() => {
    const offer = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: async () => void ((window as unknown as { installPrompted: boolean }).installPrompted = true),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })
    window.dispatchEvent(offer)
  })
}

test.describe('desktop', () => {
  test('installs as an app: manifest, icons and a service worker', async ({ page }) => {
    // First visit: the app caches itself and says so.
    await page.goto('./')
    await expect(page.getByText('StepLab now works offline on this computer.')).toBeVisible()
    await waitForApp(page)
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', './manifest.webmanifest')
    const manifest = await (await page.request.get('./manifest.webmanifest')).json()
    expect(manifest).toMatchObject({ name: 'StepLab', display: 'standalone', start_url: './' })
    for (const icon of manifest.icons) expect((await page.request.get('./' + icon.src)).ok()).toBe(true)
  })

  test('Install app appears when the browser offers it, and asks the browser to install', async ({ page }) => {
    await waitForApp(page)
    const install = page.getByRole('button', { name: 'Install app' })
    await expect(install).toHaveCount(0)
    await offerInstall(page)
    await install.click()
    expect(await page.evaluate(() => (window as unknown as { installPrompted: boolean }).installPrompted)).toBe(true)
    await expect(install).toHaveCount(0)
  })

  test('works offline after the first visit: pages, labs, upload and Download HTML', async ({ page, context }) => {
    await waitForApp(page)
    await context.setOffline(true)

    await page.reload()
    await expect(page.getByRole('button', { name: 'Upload markdown' }).first()).toBeVisible()
    await expect(page.getByText("You're offline. Writing, previewing and Download HTML still work.")).toBeVisible()

    await page.goto('./format')
    await expect(page.getByRole('heading', { name: 'Lab format' })).toBeVisible()
    await page.goto('./sample')
    await expect(page.locator('.lab-head h1')).toHaveText('Build your first Gemini chatbot with Flask')
    // The bundled fonts load offline too, so it doesn't fall back to system fonts.
    await expect
      .poll(() => page.evaluate(async () => {
        await document.fonts.ready
        return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''))
      }))
      .toEqual(expect.arrayContaining(['Inter', 'Inter Tight']))

    await page.goto('./')
    await page.getByRole('button', { name: 'Upload markdown' }).first().click()
    await page.locator('input[type=file][accept^=".md"]').setInputFiles(BASIC_LAB)
    await page.getByRole('button', { name: 'Open lab' }).click()
    await expect(page.locator('.lab-head h1')).toHaveText('Basic StepLab lab')
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download HTML' }).click()])
    expect(download.suggestedFilename()).toBe('basic-steplab-lab.html')
    await download.delete()

    await context.setOffline(false)
    await expect(page.getByText("You're offline.")).toBeHidden()
  })

  test('a new version offers Reload, and Reload switches to it', async ({ page }) => {
    await waitForApp(page)
    const original = readFileSync(SW_FILE, 'utf8')
    try {
      // Publish a "new version" of the service worker, then let the app find it.
      appendFileSync(SW_FILE, `\n// new version ${Date.now()}\n`)
      await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update())
      const banner = page.getByText('A new version of StepLab is ready.')
      await expect(banner).toBeVisible()

      await page.getByRole('button', { name: 'Reload' }).click()
      await page.waitForLoadState('load')
      await expect(banner).toBeHidden()
      await expect
        .poll(() => page.evaluate(async () => !(await navigator.serviceWorker.getRegistration())?.waiting))
        .toBe(true)
    } finally {
      writeFileSync(SW_FILE, original)
    }
  })

  test('?reset removes the service worker and every cache, then loads fresh', async ({ page }) => {
    await waitForApp(page)
    // A marker cache: if ?reset really removes every cache, this one goes too.
    await page.evaluate(async () => (await caches.open('reset-marker')).put('/marker', new Response('x')))

    await page.goto('./?reset')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Upload markdown' }).first()).toBeVisible()
    expect(await page.evaluate(async () => (await caches.keys()).includes('reset-marker'))).toBe(false)
    // The old service worker is gone, so this fresh load isn't controlled by it.
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(false)
  })
})

// A phone (same browser engine, so this can run in the desktop project).
const { defaultBrowserType: _engine, ...phone } = devices['Pixel 7']

test.describe('phone', () => {
  test.use(phone)

  test('phones get the normal website: no install, no service worker', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('button', { name: 'Menu' }).first()).toBeVisible()
    await page.waitForTimeout(1500) // give the app time to (not) register anything
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0)
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0)
    await offerInstall(page)
    await page.getByRole('button', { name: 'Menu' }).first().click()
    await expect(page.getByRole('button', { name: 'Install app' })).toHaveCount(0)
  })
})
