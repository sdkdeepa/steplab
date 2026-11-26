import { readFileSync } from 'node:fs'

/**
 * A file the site downloaded during a test (HTML or .md), saved in that test's own
 * scratch folder. The scratch folder is deleted when the test passes (see fixtures.ts).
 */
export class SavedFile {
  constructor(
    readonly name: string,
    readonly path: string,
  ) {}

  bytes() {
    return readFileSync(this.path)
  }

  text() {
    return readFileSync(this.path, 'utf8')
  }

  /** Step titles in a downloaded lab. */
  stepTitles() {
    return [...this.text().matchAll(/<section class="step"[^>]*data-title="([^"]*)"/g)].map((m) => m[1])
  }

  /** A file:// address, to open the downloaded lab on its own like a learner would. */
  url() {
    return 'file://' + this.path
  }
}
