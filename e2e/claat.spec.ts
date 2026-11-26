import { test, expect, sample } from './fixtures'

// Convert old CLaaT codelabs (Google's codelab tool) to StepLab.

test('convert a CLaaT export folder, download HTML, reopen it', async ({ home, lab }) => {
  const dialog = await home.openUpload()
  await dialog.convertClaatFolder(sample('claat', 'export'))
  await lab.expectOpen('Build a Syllabus to Study Planner with AI')

  const html = await lab.downloadHtml()
  expect(html.name).toBe('build-a-syllabus-to-study-planner-with-ai.html')
  const titles = html.stepTitles()
  expect(titles[0]).toBe('Overview')
  expect(titles).toContain('Open AI Studio Dashboard')
  expect(titles).toContain('Preview your finished app')
  // The codelab's images came along, inside the file.
  expect(html.text()).toMatch(/<img[^>]*src="data:image\/png;base64,[^"]+"[^>]*data-src="img\/f4cc6546e8ba03e\.png"/)

  const again = await home.openUpload()
  await again.chooseSavedFile(html)
  await again.openLab()
  await lab.openEditor()
  await expect(lab.editorText).toHaveValue(/^---\ntitle: Build a Syllabus to Study Planner with AI/)
})

test('convert a CLaaT markdown file: metadata, durations and asides', async ({ page, home, lab }) => {
  const dialog = await home.openUpload()
  await dialog.chooseLabFiles(sample('claat', 'codelab.md'))
  await dialog.openLab()
  await lab.expectOpen('CLaaT markdown test codelab')
  expect(await lab.stepNames()).toEqual(['Step 0: Introduction', 'Step 1: Install the tools', 'Step 2: Wrap up'])
  await expect(lab.progress).toContainText('8 min left')
  // <aside class="positive"> becomes a Tip, <aside class="negative"> a Warning.
  await expect(lab.step.locator('.callout-tip')).toContainText('This is a positive aside.')
  await expect(page.getByText('Written by StepLab Tests')).toBeVisible()
  await lab.next()
  await expect(lab.step.locator('.callout-warning')).toContainText('This is a negative aside.')

  const html = await lab.downloadHtml()
  expect(html.stepTitles()).toEqual(['Introduction', 'Install the tools', 'Wrap up'])
})
