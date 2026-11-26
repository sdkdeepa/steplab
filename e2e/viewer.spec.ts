import { test, expect, sample } from './fixtures'

// Taking a lab on the website: moving between steps, every Format-page feature, and finishing.

test.beforeEach(async ({ home }) => {
  const dialog = await home.openUpload()
  await dialog.chooseLabFiles([
    sample('feature-lab', 'feature-lab.md'),
    sample('feature-lab', 'slides', 'slide-1.png'),
    sample('feature-lab', 'slides', 'slide-2.png'),
  ])
  await dialog.openLab()
})

test('move between steps with buttons, the step list and the keyboard', async ({ page, lab }) => {
  await lab.expectOpen('Every feature lab')
  await expect(lab.progress).toHaveText('Step 0 of 3 · 10 min left')
  await expect(page.getByRole('button', { name: '← Home' })).toBeVisible()

  await lab.next()
  await expect(lab.stepHeading).toHaveText('Mobile code')
  await expect(lab.progress).toHaveText('Step 1 of 3 · 8 min left')
  await lab.back()
  await expect(lab.stepHeading).toHaveText('Overview')

  await lab.goToStep('Step 3: Finish')
  await expect(lab.stepHeading).toHaveText('Finish')
  // The address counts positions: with a Step 0, "Step 3" is the 4th step.
  await expect(page).toHaveURL(/#step-4$/)

  await page.keyboard.press('ArrowLeft')
  await expect(lab.stepHeading).toHaveText('Slides and video')
  await page.keyboard.press('ArrowRight')
  await expect(lab.stepHeading).toHaveText('Finish')
})

test('front matter: sandbox and Colab buttons, copyright and LinkedIn', async ({ page, lab }) => {
  await expect(page.getByRole('link', { name: /Launch sandbox/ })).toHaveAttribute('href', 'https://codespaces.new/sdkdeepa/steplab-sandbox-node-api?quickstart=1')
  await expect(page.getByRole('link', { name: /Open in Colab/ })).toHaveAttribute(
    'href',
    'https://colab.research.google.com/github/googlecolab/colabtools/blob/main/notebooks/colab-github-demo.ipynb',
  )
  await expect(lab.step.locator('.copyright-top')).toContainText('(c) 2026 StepLab Tests')
  await expect(lab.step.locator('.copyright-top a')).toHaveAttribute('href', 'https://www.linkedin.com/in/steplab-tests')
})

test('callouts: Note, Tip and Warning', async ({ lab }) => {
  for (const [kind, text] of [
    ['note', 'This is a note callout.'],
    ['tip', 'This is a tip callout.'],
    ['warning', 'This is a warning callout.'],
  ])
    await expect(lab.step.locator(`.callout-${kind}`)).toContainText(text)
})

test('mobile languages are highlighted, and Copy copies the code', async ({ page, lab, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await lab.next()
  for (const language of ['kotlin', 'swift', 'objectivec', 'dart']) {
    const block = lab.step.locator('.code', { has: page.locator('.code-bar', { hasText: language }) })
    await expect(block.locator('.hljs-keyword, .hljs-meta, .hljs-built_in, .hljs-title').first()).toBeVisible()
  }
  const kotlin = lab.step.locator('.code').first()
  await kotlin.getByRole('button', { name: 'Copy' }).click()
  await expect(kotlin.getByRole('button', { name: 'Copied' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('fun Greeting(name: String)')
})

test('slides deck moves between slides, and a YouTube link becomes a video', async ({ lab }) => {
  await lab.goToStep('Step 2: Slides and video')
  const deck = lab.step.getByRole('figure', { name: 'Slides' })
  await expect(deck.getByRole('img', { name: 'Slide 1 of 2' })).toBeVisible()
  await deck.getByRole('button', { name: 'Next slide' }).click()
  await expect(deck.getByRole('img', { name: 'Slide 2 of 2' })).toBeVisible()
  await expect(deck.getByRole('img', { name: 'Slide 1 of 2' })).toBeHidden()
  await expect(lab.step.locator('iframe')).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\/aqz-KE-bpKQ/)
})

test('finishing shows Congratulations, and Start over goes back to the beginning', async ({ lab }) => {
  await lab.goToStep('Step 3: Finish')
  await lab.finish()
  await expect(lab.congrats).toBeVisible()
  await expect(lab.congrats).toContainText("You've finished Every feature lab.")
  await expect(lab.congrats).toContainText('4steps done')
  await expect(lab.congrats).toContainText('10minutes of hands-on work')
  await lab.congrats.getByRole('button', { name: 'Start over' }).click()
  await expect(lab.congrats).toBeHidden()
  await expect(lab.stepHeading).toHaveText('Overview')
})
