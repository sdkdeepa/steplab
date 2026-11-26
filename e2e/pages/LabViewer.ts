import { expect, type Locator, type Page } from '@playwright/test'
import type { Scratch } from '../fixtures'
import type { SavedFile } from './SavedFile'

/** An open lab on the website: header, step list, the step itself, pager, editor and finish pop-up. */
export class LabViewer {
  readonly title: Locator
  readonly progress: Locator
  readonly stepList: Locator
  readonly step: Locator
  readonly stepHeading: Locator
  readonly congrats: Locator
  readonly editorText: Locator

  constructor(
    private readonly page: Page,
    private readonly scratch: Scratch,
  ) {
    this.title = page.locator('.lab-head h1')
    this.progress = page.locator('.lab-head p').first()
    this.stepList = page.getByRole('navigation', { name: 'Steps' })
    this.step = page.locator('article.sheet')
    this.stepHeading = this.step.locator('h2').first()
    this.congrats = page.getByRole('dialog', { name: 'Congratulations!' })
    this.editorText = page.getByRole('textbox', { name: 'Lab markdown' })
  }

  async expectOpen(title: string) {
    await expect(this.title).toHaveText(title)
  }

  /** "Step 0: Overview", "Step 1: Set up", … as listed in the side rail. */
  stepNames() {
    return this.stepList.getByRole('button').evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')))
  }

  next() {
    return this.page.getByRole('button', { name: 'Next →' }).click()
  }

  back() {
    return this.page.getByRole('button', { name: '← Back' }).click()
  }

  finish() {
    return this.page.getByRole('button', { name: 'Finish ✓' }).click()
  }

  goToStep(name: string) {
    return this.stepList.getByRole('button', { name }).click()
  }

  async downloadHtml(): Promise<SavedFile> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: 'Download HTML' }).click(),
    ])
    return this.scratch.save(download)
  }

  async openEditor() {
    await this.page.getByRole('button', { name: 'Edit markdown' }).click()
    await expect(this.editorText).toBeVisible()
  }

  async saveMarkdown(): Promise<SavedFile> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: 'Save .md' }).click(),
    ])
    return this.scratch.save(download)
  }
}
