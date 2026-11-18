/**
 * Converts Google CLaaT ("Codelabs as a Thing") markdown into StepLab markdown.
 * Framework-free, so the web app, the editor extension and the CLI can all use it.
 */

const STEP_HEADING = /^#{1,3}\s*step\s*\d+/im
const INTRO = /^(overview|introduction|intro|before you begin|welcome)\b/i

/** True when a file looks like a CLaaT codelab that hasn't been converted yet. */
export function looksLikeClaat(src: string): boolean {
  const text = src.replace(/\r\n?/g, '\n')
  if (/^---\s*$/m.test(text.split('\n')[0] ?? '')) return false // StepLab front matter
  const head = text.split(/^#\s/m)[0]
  const meta = /^(id|authors|summary|status|categories|feedback link)\s*:/gim
  const metaCount = (head.match(meta) || []).length
  const hasAsides = /<aside\s+class=["'](positive|negative)["']/i.test(text)
  const hasSteps = /^##\s+\S/m.test(text)
  return hasSteps && (metaCount >= 2 || (hasAsides && !STEP_HEADING.test(text)))
}

/** "Step 1 · Open AI Studio" → "Open AI Studio". CLaaT authors often number steps by hand. */
export function stripStepPrefix(name: string): string {
  return name.replace(/^step\s*\d+\s*[:.)\-–—·•|]?\s*/i, '').trim() || name
}

export function convertClaat(src: string): string {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const meta: Record<string, string> = {}
  let i = 0

  // CLaaT metadata: "key: value" lines before the "# Title" line.
  while (i < lines.length && !/^#\s/.test(lines[i])) {
    const m = lines[i].match(/^([A-Za-z][\w ]*):\s*(.*)$/)
    if (m) meta[m[1].trim().toLowerCase()] = m[2].trim()
    i++
  }
  const title = (lines[i] || '').replace(/^#\s*/, '').trim() || meta.summary || 'Untitled lab'
  i++

  const body: string[] = []
  let fence: string | null = null
  let step = 0
  let first = true
  let legacy: 'Tip' | 'Warning' | null = null // old "Positive" / "Negative" line, then ": text"

  for (; i < lines.length; i++) {
    const line = lines[i]

    const f = line.match(/^\s*(`{3,}|~{3,})/)
    if (f) {
      if (!fence) fence = f[1]
      else if (line.trim().startsWith(fence)) fence = null
      body.push(line)
      continue
    }
    if (fence) {
      body.push(line)
      continue
    }

    const h = line.match(/^##\s+(.*)$/)
    if (h) {
      const name = stripStepPrefix(h[1].trim())
      step = first ? (INTRO.test(name) ? 0 : 1) : step + 1
      first = false
      body.push(`## Step ${step}: ${name}`)
      continue
    }

    // <aside class="positive"> … </aside>, on one line or several
    const open = line.match(/^\s*<aside\s+class=["'](positive|negative|special|warning)["']\s*>(.*)$/i)
    if (open) {
      const label = /negative|warning/i.test(open[1]) ? 'Warning' : 'Tip'
      const inner: string[] = []
      let rest = open[2]
      for (;;) {
        const end = rest.indexOf('</aside>')
        if (end >= 0) {
          inner.push(rest.slice(0, end))
          break
        }
        inner.push(rest)
        if (++i >= lines.length) break
        rest = lines[i]
      }
      const text = inner.map((s) => s.replace(/<\/?p>/g, '').trim()).filter(Boolean)
      body.push(`> ${label}: ${text[0] ?? ''}`, ...text.slice(1).map((t) => `> ${t}`))
      continue
    }

    if (/^(positive|negative)\s*$/i.test(line.trim())) {
      legacy = /negative/i.test(line) ? 'Warning' : 'Tip'
      continue
    }
    if (legacy && /^:\s*/.test(line)) {
      body.push(`> ${legacy}: ${line.replace(/^:\s*/, '')}`)
      legacy = null
      continue
    }
    legacy = null
    body.push(line)
  }

  const author = (meta.authors || meta.author || '').split(',')[0].trim()
  const out = ['---', `title: ${title}`, ...(author ? [`author: ${author}`] : []), '---', '', `# ${title}`, '']
  if (meta.summary) out.push(meta.summary, '')
  return [...out, ...body].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
