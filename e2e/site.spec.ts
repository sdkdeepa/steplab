import { test, expect } from './fixtures'

// The website's own pages.

test('home page loads with its main actions', async ({ page, home }) => {
  await home.goto()
  await expect(page).toHaveTitle(/StepLab/)
  await expect(page.getByRole('button', { name: 'Upload markdown' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Try the sample lab/ })).toBeVisible()
})

test('the sample lab opens at /sample', async ({ home, lab }) => {
  await home.goto('sample')
  await lab.expectOpen('Build your first Gemini chatbot with Flask')
  expect((await lab.stepNames()).length).toBeGreaterThan(2)
})

test('the template opens at /sample-template', async ({ home, lab }) => {
  await home.goto('sample-template')
  await lab.expectOpen('StepLab: workshops, step by step')
})

test('the format page lists the rules and opens the template', async ({ page, home, lab }) => {
  await home.goto('format')
  await expect(page.getByRole('heading', { name: 'Lab format' })).toBeVisible()
  for (const rule of ['Duration: 5', 'Note:', 'sandbox:', 'colab:']) await expect(page.locator('.rules')).toContainText(rule)
  await expect(page.getByText('Objective-C')).toBeVisible()
  await page.getByRole('button', { name: 'Open the template' }).click()
  await lab.expectOpen('StepLab: workshops, step by step')
})

test('the theme switch is remembered after a reload', async ({ page, home }) => {
  await home.goto()
  const before = await home.theme()
  await home.themeToggle().click()
  const after = await home.theme()
  expect(after).not.toBe(before)
  await page.reload()
  expect(await home.theme()).toBe(after)
})
