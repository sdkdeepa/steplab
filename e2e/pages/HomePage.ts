import { expect, type Page } from '@playwright/test'
import { UploadDialog } from './UploadDialog'

/** The website's own pages: home, /sample, /sample-template and /format. */
export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(path: '' | 'sample' | 'sample-template' | 'format' = '') {
    await this.page.goto('./' + path)
  }

  /** Opens the upload pop-up from the home page. */
  async openUpload(): Promise<UploadDialog> {
    await this.goto()
    await this.page.getByRole('button', { name: 'Upload markdown' }).first().click()
    const dialog = new UploadDialog(this.page)
    await expect(dialog.dialog).toBeVisible()
    return dialog
  }

  themeToggle() {
    return this.page.getByRole('button', { name: /^Switch to (light|dark) theme$/ }).first()
  }

  theme() {
    return this.page.evaluate(() => document.documentElement.dataset.theme)
  }
}
