import { expect, type Locator, type Page } from '@playwright/test'
import type { SavedFile } from './SavedFile'

/** The "Open a lab" pop-up: a .md (+ images), a StepLab download, or an old CLaaT codelab folder. */
export class UploadDialog {
  readonly dialog: Locator
  readonly error: Locator

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog')
    this.error = this.dialog.getByRole('alert')
  }

  /** Picks .md files and images, or a downloaded .html. */
  async chooseLabFiles(paths: string | string[]) {
    await this.page.locator('input[type=file][accept^=".md"]').setInputFiles(paths)
  }

  /** Picks a file that was downloaded earlier, under its real name (as a person would). */
  async chooseSavedFile(file: SavedFile) {
    await this.page.locator('input[type=file][accept^=".md"]').setInputFiles({
      name: file.name,
      mimeType: file.name.endsWith('.md') ? 'text/markdown' : 'text/html',
      buffer: file.bytes(),
    })
  }

  async openLab() {
    await this.dialog.getByRole('button', { name: 'Open lab' }).click()
  }

  async convertClaatFolder(folder: string) {
    await this.dialog.getByRole('tab', { name: /Old CLaaT codelab/ }).click()
    await this.page.locator('input[type=file][webkitdirectory]').setInputFiles(folder)
    await this.dialog.getByRole('button', { name: 'Convert to StepLab' }).click()
  }

  async expectError(text: string) {
    await expect(this.error).toContainText(text)
  }
}
