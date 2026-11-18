import { readImages, isImageFile, isLabFile, type Assets } from './assets'
import { parseLab } from './parser'
import { convertClaat, looksLikeClaat } from './claat'

export const isHtmlFile = (f: File) => /\.html?$/i.test(f.name) || f.type === 'text/html'

export type Prepared =
  | { ok: true; markdown: string; name: string; assets: Assets; reopened: boolean; fromClaat?: boolean }
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
  const html = files.find((f) => isHtmlFile(f) && /^index\.html?$/i.test(f.name)) ?? files.find(isHtmlFile)
  const other = files.filter((f) => !isLabFile(f) && !isHtmlFile(f) && !isImageFile(f) && !/\.json$/i.test(f.name))

  if (!md && html) {
    if (html.size > 60_000_000) return { ok: false, error: `"${html.name}" is too large to reopen.` }
    const text = await html.text()
    // An old CLaaT codelab: the folder `claat export` made (index.html, codelab.json, img/).
    const { isClaatHtml, convertClaatHtml } = await import('./claatHtml')
    if (isClaatHtml(text)) {
      const jsonFile = files.find((f) => f.name.toLowerCase() === 'codelab.json')
      const json = jsonFile ? await jsonFile.text() : undefined
      let id = 'codelab'
      try {
        id = JSON.parse(json ?? '{}').id || id
      } catch {
        /* keep the default */
      }
      const markdown = convertClaatHtml(text, json)
      if (!parseLab(markdown).steps.length) return { ok: false, error: `"${html.name}" has no codelab steps to convert.` }
      return { ok: true, markdown, name: `${id}.steplab.md`, assets: await readImages(files), reopened: false, fromClaat: true }
    }
    return reopenHtml(text, html.name)
  }
  if (!md) {
    if (other.length) return { ok: false, error: `StepLab can't open "${other[0].name}". Choose a .md file (and its images).` }
    return { ok: false, error: 'Images alone aren\'t a lab. Add the .md file too.' }
  }
  if (md.size > 2_000_000) return { ok: false, error: `"${md.name}" is over 2 MB. Labs are usually much smaller. Is it the right file?` }
  let markdown = await md.text()
  let name = md.name
  let fromClaat = false
  // A CLaaT .md source: convert it to StepLab on the way in.
  if (looksLikeClaat(markdown)) {
    markdown = convertClaat(markdown)
    name = md.name.replace(/\.(md|markdown|txt)$/i, '') + '.steplab.md'
    fromClaat = true
  }
  if (!parseLab(markdown).steps.length)
    return {
      ok: false,
      error: `"${md.name}" has no steps. Start each step with a heading like "## Step 0: Overview" or "## Step 1: Set up".`,
    }
  return { ok: true, markdown, name, assets: await readImages(files), reopened: false, fromClaat }
}

/**
 * Files from a drop, including everything inside dropped folders
 * (so a whole exported CLaaT folder can be dragged in).
 */
export async function filesFromDrop(dt: DataTransfer): Promise<File[]> {
  const entries = Array.from(dt.items ?? [])
    .map((i) => (i.kind === 'file' ? i.webkitGetAsEntry?.() : null))
    .filter((e): e is FileSystemEntry => !!e)
  if (!entries.some((e) => e.isDirectory)) return Array.from(dt.files)
  const out: File[] = []
  const walk = async (entry: FileSystemEntry, depth: number): Promise<void> => {
    if (entry.isFile) {
      out.push(await new Promise<File>((ok, fail) => (entry as FileSystemFileEntry).file(ok, fail)))
    } else if (entry.isDirectory && depth < 4) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      // readEntries returns results in batches; keep reading until it's empty
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((ok, fail) => reader.readEntries(ok, fail))
        if (!batch.length) break
        for (const child of batch) await walk(child, depth + 1)
      }
    }
  }
  for (const e of entries) await walk(e, 0)
  // Keep only what a lab can use, so a big folder doesn't flood the list.
  return out.filter((f) => isLabFile(f) || isHtmlFile(f) || isImageFile(f) || f.name.toLowerCase() === 'codelab.json')
}
