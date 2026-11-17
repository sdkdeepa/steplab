import { readImages, isImageFile, isLabFile, type Assets } from './assets'
import { parseLab } from './parser'

export const isHtmlFile = (f: File) => /\.html?$/i.test(f.name) || f.type === 'text/html'

export type Prepared =
  | { ok: true; markdown: string; name: string; assets: Assets; reopened: boolean }
  | { ok: false; error: string }

const fileKey = (src: string) => {
  try {
    src = decodeURIComponent(src)
  } catch {
    /* keep */
  }
  return src.split(/[?#]/)[0].split('/').pop()!.toLowerCase()
}

/** Reads a lab downloaded from StepLab back into markdown + its images. */
function reopenHtml(html: string, name: string): Prepared {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const isStepLab = doc.querySelector('meta[name="generator"][content="StepLab"]')
  const src = doc.getElementById('steplab-source')
  if (!isStepLab)
    return { ok: false, error: `"${name}" isn't a StepLab lab. Upload the .md file you wrote (and its images).` }
  if (!src?.textContent)
    return {
      ok: false,
      error: `"${name}" was downloaded with an older version of StepLab, so it can't be reopened for editing. Upload the .md file you wrote instead. Labs you download from now on can be reopened.`,
    }
  let markdown = ''
  try {
    markdown = JSON.parse(src.textContent)
  } catch {
    return { ok: false, error: `"${name}" looks damaged and can't be reopened. Upload the .md file instead.` }
  }
  const assets: Assets = {}
  doc.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
    const s = img.getAttribute('src') || ''
    if (s.startsWith('data:')) assets[fileKey(img.dataset.src!)] = s
  })
  return { ok: true, markdown, name, assets, reopened: true }
}

/**
 * Turns whatever the person picked or dropped into a lab:
 * a .md (+ images), or a StepLab .html download.
 */
export async function prepareFiles(files: File[]): Promise<Prepared> {
  if (!files.length) return { ok: false, error: 'Choose a .md file to open.' }
  const md = files.find(isLabFile)
  const html = files.find(isHtmlFile)
  const other = files.filter((f) => !isLabFile(f) && !isHtmlFile(f) && !isImageFile(f))

  if (!md && html) {
    if (html.size > 60_000_000) return { ok: false, error: `"${html.name}" is too large to reopen.` }
    return reopenHtml(await html.text(), html.name)
  }
  if (!md) {
    if (other.length) return { ok: false, error: `StepLab can't open "${other[0].name}". Choose a .md file (and its images).` }
    return { ok: false, error: 'Images alone aren\'t a lab. Add the .md file too.' }
  }
  if (md.size > 2_000_000) return { ok: false, error: `"${md.name}" is over 2 MB. Labs are usually much smaller. Is it the right file?` }
  const markdown = await md.text()
  if (!parseLab(markdown).steps.length)
    return {
      ok: false,
      error: `"${md.name}" has no steps. Start each step with a heading like "## Step 0: Overview" or "## Step 1: Set up".`,
    }
  return { ok: true, markdown, name: md.name, assets: await readImages(files), reopened: false }
}
