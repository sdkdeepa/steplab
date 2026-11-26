import { test as base, expect, type Download } from '@playwright/test'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HomePage } from './pages/HomePage'
import { LabViewer } from './pages/LabViewer'
import { SavedFile } from './pages/SavedFile'

/** The master sample files. Tests only read them (global-setup.ts checks they never change). */
export const SAMPLES = fileURLToPath(new URL('./fixtures/', import.meta.url))
export const sample = (...parts: string[]) => join(SAMPLES, ...parts)

/** Where a test keeps the files it downloads. Deleted when the test passes. */
export interface Scratch {
  save(download: Download): Promise<SavedFile>
}

interface Fixtures {
  home: HomePage
  lab: LabViewer
  scratch: Scratch
}

export const test = base.extend<Fixtures>({
  // Tests never reach the internet: anything not served by the local site is blocked,
  // so results don't depend on YouTube, Google Fonts or anyone's network.
  page: async ({ page, baseURL }, use) => {
    const local = new URL(baseURL!).origin
    await page.route('**/*', (route) => {
      const url = route.request().url()
      return url.startsWith(local) || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('file:')
        ? route.continue()
        : route.abort()
    })
    await use(page)
  },

  scratch: async ({}, use, testInfo) => {
    const dir = testInfo.outputPath('downloads')
    mkdirSync(dir, { recursive: true })
    await use({
      async save(download) {
        const file = new SavedFile(download.suggestedFilename(), join(dir, download.suggestedFilename()))
        await download.saveAs(file.path)
        return file
      },
    })
    // Passed: the downloads were verified, so delete them now.
    // Failed: keep them for you to look at; the next run starts with an empty folder anyway.
    if (testInfo.status === testInfo.expectedStatus) rmSync(dir, { recursive: true, force: true })
  },

  home: async ({ page }, use) => use(new HomePage(page)),
  lab: async ({ page, scratch }, use) => use(new LabViewer(page, scratch)),
})

export { expect }
