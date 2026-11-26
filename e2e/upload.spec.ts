import { readFileSync } from 'node:fs'
import { test, expect, sample } from './fixtures'

// Upload a .md (with or without images), download HTML, and reopen downloads.

test('upload a .md, download HTML, reopen it', async ({ home, lab }) => {
  const dialog = await home.openUpload()
  await dialog.chooseLabFiles(sample('basic-lab.md'))
  await dialog.openLab()
  await lab.expectOpen('Basic StepLab lab')
  expect(await lab.stepNames()).toEqual(['Step 0: Overview', 'Step 1: Set up', 'Step 2: Write the server', 'Step 3: Done'])

  const html = await lab.downloadHtml()
  expect(html.name).toBe('basic-steplab-lab.html')
  expect(html.stepTitles()).toEqual(['Overview', 'Set up', 'Write the server', 'Done'])

  const again = await home.openUpload()
  await again.chooseSavedFile(html)
  await again.openLab()
  await lab.openEditor()
  await expect(lab.editorText).toHaveValue(readFileSync(sample('basic-lab.md'), 'utf8'))
})

test('upload a .md with images, download HTML, reopen it with its images', async ({ page, home, lab }) => {
  const dialog = await home.openUpload()
  await dialog.chooseLabFiles([sample('image-lab', 'image-lab.md'), sample('image-lab', 'img', 'terms.png'), sample('image-lab', 'logo.svg')])
  await dialog.openLab()
  await expect(page.getByRole('img', { name: 'Terms', exact: true })).toBeVisible()

  const html = await lab.downloadHtml()
  expect(html.stepTitles()).toEqual(['Overview', 'Logo', 'Done'])
  // Images are inside the file (works offline), with their paths kept for reopening.
  expect(html.text()).not.toMatch(/<img[^>]*\ssrc="(img\/terms\.png|\.\/logo\.svg)"/)
  expect(html.text()).toMatch(/<img[^>]*src="data:image\/png;base64,[^"]+"[^>]*data-src="img\/terms\.png"/)
  expect(html.text()).toMatch(/<img[^>]*src="data:image\/svg\+xml;base64,[^"]+"[^>]*data-src="\.\/logo\.svg"/)

  const again = await home.openUpload()
  await again.chooseSavedFile(html)
  await again.openLab()
  const terms = page.getByRole('img', { name: 'Terms', exact: true })
  await expect(terms).toBeVisible()
  expect(await terms.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(40)
  await lab.next()
  const logo = page.getByRole('img', { name: 'Logo' })
  await expect(logo).toBeVisible()
  expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(30)
  await lab.openEditor()
  await expect(lab.editorText).toHaveValue(readFileSync(sample('image-lab', 'image-lab.md'), 'utf8'))
})

test('every heading style on the Format page becomes a step', async ({ home, lab }) => {
  const dialog = await home.openUpload()
  await dialog.chooseLabFiles(sample('heading-styles.md'))
  await dialog.openLab()
  await lab.expectOpen('Heading styles lab')
  expect(await lab.stepNames()).toEqual(['Step 0: Overview', 'Step 1: Hash and dash', 'Step 2: Three hashes, caps and a dot'])
  // "Duration: 5:00" and "Duration: 2" both count.
  await expect(lab.progress).toContainText('7 min left')
})

test('an HTML file not made by StepLab is refused with a clear message', async ({ home }) => {
  const dialog = await home.openUpload()
  await dialog.chooseLabFiles(sample('not-steplab.html'))
  await dialog.openLab()
  await dialog.expectError(`"not-steplab.html" isn't a StepLab lab.`)
})

test('a StepLab download from an older version explains why it cannot be reopened', async ({ home }) => {
  const dialog = await home.openUpload()
  await dialog.chooseLabFiles(sample('old-steplab-download.html'))
  await dialog.openLab()
  await dialog.expectError('was downloaded with an older version of StepLab')
})
