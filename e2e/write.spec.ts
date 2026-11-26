import { test, expect, sample } from './fixtures'

// Write a lab on the website, download it as HTML, and come back later to edit it.

const MY_LAB = `---
title: My first e2e lab
---

## Step 1: Set up
Duration: 2

Install **Node.js**.

## Step 2: Run it
Duration: 3

\`\`\`bash
npm start
\`\`\`

## Step 3: Done
Duration: 1

You did it.
`

test('write a lab, see it live, download HTML, reopen it and save the same .md', async ({ page, home, lab }) => {
  await home.goto('sample-template')
  await lab.openEditor()
  await lab.editorText.fill(MY_LAB)
  // The preview follows the editor as you type.
  await lab.expectOpen('My first e2e lab')
  await expect(lab.stepHeading).toHaveText('Set up')

  const html = await lab.downloadHtml()
  expect(html.name).toBe('my-first-e2e-lab.html')
  expect(html.text()).toContain('<meta name="generator" content="StepLab">')
  expect(html.stepTitles()).toEqual(['Set up', 'Run it', 'Done'])
  expect(html.text()).toContain('npm start')

  // A month later, with only the HTML:
  const dialog = await home.openUpload()
  await dialog.chooseSavedFile(html)
  await dialog.openLab()
  await lab.expectOpen('My first e2e lab')
  await lab.openEditor()
  await expect(lab.editorText).toHaveValue(MY_LAB)

  const md = await lab.saveMarkdown()
  expect(md.name).toBe('my-first-e2e-lab.md')
  expect(md.text()).toBe(MY_LAB)
  await expect(page.getByRole('button', { name: 'Download HTML' })).toBeEnabled()
})

test('edits to an uploaded lab show up and are in the download', async ({ home, lab }) => {
  const dialog = await home.openUpload()
  await dialog.chooseLabFiles(sample('basic-lab.md'))
  await dialog.openLab()
  await lab.openEditor()
  await lab.editorText.fill((await lab.editorText.inputValue()).replace('## Step 3: Done', '## Step 3: All done'))
  await lab.goToStep('Step 3: All done')
  await expect(lab.stepHeading).toHaveText('All done')
  const html = await lab.downloadHtml()
  expect(html.stepTitles()).toEqual(['Overview', 'Set up', 'Write the server', 'All done'])
})
