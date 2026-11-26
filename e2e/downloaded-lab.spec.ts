import { test, expect, sample } from './fixtures'

// A downloaded lab is one HTML file that learners open on their own, without StepLab or the internet.

test('a downloaded lab works on its own, offline: steps, images, finish and theme', async ({ page, home, lab }) => {
  const dialog = await home.openUpload()
  await dialog.chooseLabFiles([sample('image-lab', 'image-lab.md'), sample('image-lab', 'img', 'terms.png'), sample('image-lab', 'logo.svg')])
  await dialog.openLab()
  const html = await lab.downloadHtml()

  await page.context().setOffline(true)
  await page.goto(html.url())
  await expect(page).toHaveTitle(/Reopen test lab/)
  const current = page.locator('section.step:visible')
  await expect(current.locator('h2').first()).toHaveText('Overview')
  const terms = current.getByRole('img', { name: 'Terms', exact: true })
  await expect(terms).toBeVisible()
  expect(await terms.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(40)

  await expect(page.locator('#prev')).toBeDisabled()
  await page.locator('#next').click()
  await expect(current.locator('h2').first()).toHaveText('Logo')
  expect(await current.getByRole('img', { name: 'Logo' }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(30)

  await page.locator('#next').click()
  await expect(page.locator('#next')).toHaveText('Finish ✓')
  await page.locator('#prev').click()
  await expect(current.locator('h2').first()).toHaveText('Logo')

  const theme = () => page.evaluate(() => document.documentElement.dataset.theme)
  const before = await theme()
  await page.locator('#theme').click()
  expect(await theme()).not.toBe(before)
})
