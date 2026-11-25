import { renderMarkdown } from './markdown'
import { readSandbox, type Sandbox } from './sandbox'
import { readColab, type Colab } from './colab'
import { splitFrontMatter } from './frontMatter'

export interface Step {
  /** The number written in the heading ("Step 3" -> 3). Sections before Step 1 get 0. */
  num: number
  /** What the viewer shows: "Step 0", "Step 3". */
  label: string
  /** The number shown in the step list dot. */
  badge: string
  title: string
  /** Minutes, from a "Duration:" line (5, 5 min, 5:00, 1:30:00). 0 when missing. */
  duration: number
  markdown: string
  html: string
}

export interface Copyright {
  /** Text with {author} and {year} filled in, e.g. "© 2026 Jane Doe. All rights reserved." */
  text: string
  name?: string
  linkedin?: string
  position: 'top' | 'bottom' | 'both'
}

export interface Lab {
  title: string
  copyright: Copyright | null
  author?: string
  summary?: string
  /** From `sandbox:` in front matter: a GitHub repo to open in Codespaces. */
  sandbox: Sandbox | null
  /** From `colab:` in front matter: a notebook on GitHub or Drive to open in Google Colab. */
  colab: Colab | null
  steps: Step[]
  warnings: string[]
  totalMinutes: number
}

/**
 * A step starts at any #, ## or ### heading that begins with "Step <number>".
 * "## Step 0: Overview", "## Step 1: Title", "# Step 2 - Title", "### STEP 3. Title" and "## Step 4 · Title" all work.
 * A plain "## Overview" (or "## Introduction") placed before Step 1 also becomes Step 0.
 */
export const STEP_HEADING = /^#{1,3}\s*step\s*(\d+)\s*[:.)\-–—·•|]?\s*(.*)$/i
const SECTION_HEADING = /^##\s+(.+?)\s*#*\s*$/
const DURATION = /^duration\s*:\s*(.+)$/i

/** "5" | "5 min" | "45 minutes guided…" -> minutes; "5:00" (m:ss) -> 5; "1:30:00" (h:mm:ss) -> 90 */
export function parseDuration(raw: string): number {
  const v = raw.trim()
  const hms = v.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?\b/)
  if (hms) return hms[3] !== undefined ? Number(hms[1]) * 60 + Number(hms[2]) : Number(hms[1]) + (Number(hms[2]) >= 30 ? 1 : 0)
  const n = v.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?)?\b/i)
  if (!n) return 0
  return Math.round(Number(n[1]) * (n[2] ? 60 : 1))
}

export function parseLab(source: string, render: (md: string) => string = renderMarkdown): Lab {
  const split = splitFrontMatter(source.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, ''))
  const meta = split.meta
  const text = split.body

  type Raw = { num: number; title: string; lines: string[]; intro?: boolean }
  const raw: Raw[] = []
  let current: Raw | null = null
  let fence = '' // the open fence marker, e.g. "```" or "~~~~"
  let firstH1 = ''
  let seenStep = false
  const hasStepHeadings = (() => {
    let f = ''
    for (const line of text.split('\n')) {
      const m = line.match(/^\s{0,3}(`{3,}|~{3,})/)
      if (m) f = !f ? m[1] : m[1][0] === f[0] && m[1].length >= f.length ? '' : f
      else if (!f && STEP_HEADING.test(line)) return true
    }
    return false
  })()

  for (const line of text.split('\n')) {
    const f = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (f) {
      if (!fence) fence = f[1]
      else if (f[1][0] === fence[0] && f[1].length >= fence.length && !line.trim().slice(f[1].length).trim()) fence = ''
    }
    const outside = !fence && !f
    const m = outside ? line.match(STEP_HEADING) : null
    if (m) {
      seenStep = true
      current = { num: Number(m[1]), title: m[2].trim() || `Step ${m[1]}`, lines: [] }
      raw.push(current)
      continue
    }
    // The first "## Overview" / "## Introduction" (any ## heading) before Step 1 becomes Step 0.
    const sec: RegExpMatchArray | null = outside && !seenStep && !current && hasStepHeadings ? line.match(SECTION_HEADING) : null
    if (sec) {
      current = { num: 0, title: sec[1].trim(), lines: [], intro: true }
      raw.push(current)
      continue
    }
    if (current) current.lines.push(line)
    else if (!firstH1 && !fence) {
      const h = line.match(/^#\s+(.+)$/)
      if (h) firstH1 = h[1].trim()
    }
  }

  const steps: Step[] = raw.map((r) => {
    let duration = 0
    // "Duration: …" counts only as the first non-blank line under the step heading
    const first = r.lines.findIndex((l) => l.trim() !== '')
    const lines = [...r.lines]
    const d = first >= 0 ? lines[first].trim().match(DURATION) : null
    if (d) {
      duration = parseDuration(d[1])
      lines.splice(first, 1)
    }
    const markdown = lines.join('\n').trim()
    return { num: r.num, label: '', badge: '', title: r.title, duration, markdown, html: render(markdown) }
  })

  // Show the author's own numbers when they count up from 0 or 1; otherwise fall back to position.
  const base = steps[0]?.num === 0 ? 0 : 1
  const sequential = steps.every((s, i) => s.num === i + base)
  steps.forEach((s, i) => {
    const n = sequential ? s.num : i + base
    s.label = `Step ${n}`
    s.badge = String(n)
  })

  const warnings: string[] = []
  if (!sequential)
    steps.forEach((s, i) => {
      if (s.num !== i + base) warnings.push(`"Step ${s.num}" is step ${i + base} in the file. Steps are shown in file order.`)
    })

  return {
    title: meta.title || firstH1 || 'Untitled lab',
    copyright: readCopyright(meta),
    author: meta.author,
    summary: meta.summary || meta.description,
    sandbox: readSandbox(meta.sandbox),
    colab: readColab(meta.colab),
    steps,
    warnings,
    totalMinutes: steps.reduce((a, s) => a + s.duration, 0),
  }
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'lab'

/**
 * Front matter:
 *   author: Jane Doe                                  (also used as {author} / {name} below)
 *   linkedin: https://www.linkedin.com/in/jane-doe
 *   copyright: © {year} {author}. All rights reserved.   (or "none" to hide)
 *   copyright_position: both                           (top, bottom or both)
 * The copyright line appears when `copyright` or `linkedin` is set.
 */
function readCopyright(meta: Record<string, string>): Copyright | null {
  const raw = meta.copyright
  if (raw && /^(none|off|false|no|hide)$/i.test(raw)) return null
  const name = meta.author || meta.name // "name" still works in older files
  if (!raw && !meta.linkedin) return null
  const year = String(new Date().getFullYear())
  const text = (raw || '© {year} {author}. All rights reserved.')
    .replace(/\{year\}/gi, year)
    .replace(/\{(?:name|author)\}/gi, name || '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const linkedin = /^https:\/\/([\w-]+\.)?linkedin\.com\//i.test(meta.linkedin || '') ? meta.linkedin : undefined
  const pos = (meta.copyright_position || 'both').toLowerCase()
  const position = pos === 'top' || pos === 'bottom' ? pos : 'both'
  return { text, name, linkedin, position }
}

/** "https://www.linkedin.com/in/jane-doe/" -> "linkedin.com/in/jane-doe" (the text shown for the link) */
export function linkedinText(url: string): string {
  const m = url.match(/linkedin\.com\/(in|company|school)\/([^/?#]+)/i)
  return m ? `linkedin.com/${m[1].toLowerCase()}/${decodeURIComponent(m[2])}` : 'LinkedIn'
}
