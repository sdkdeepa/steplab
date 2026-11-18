/**
 * Converts an exported CLaaT codelab (the folder `claat export` makes: index.html,
 * codelab.json and img/) into StepLab markdown. Image paths stay as they are
 * (img/…), so the .md works when saved in the same folder.
 */
import TurndownService from 'turndown'
import { stripStepPrefix } from './claat'

const INTRO = /^(overview|introduction|intro|before you begin|welcome)\b/i

/** True for the index.html that `claat export` writes. */
export function isClaatHtml(html: string): boolean {
  return /<google-codelab[\s>]/i.test(html) && /<google-codelab-step[\s>]/i.test(html)
}

interface ClaatMeta {
  title?: string
  summary?: string
  authors?: string
}

function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))
  return m ? decode(m[1]) : undefined
}

function makeTurndown(): TurndownService {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '*' })

  // Headings inside a step move down one level, so they never look like a new step.
  td.addRule('headings', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: (content, node) => {
      const level = Math.min(Number(node.nodeName.charAt(1)) + 1, 6)
      return `\n\n${'#'.repeat(level)} ${content.trim()}\n\n`
    },
  })

  // <aside class="positive|special"> → Tip, <aside class="warning|negative"> → Warning
  td.addRule('asides', {
    filter: (node) => node.nodeName === 'ASIDE',
    replacement: (content, node) => {
      const cls = (node as HTMLElement).getAttribute('class') || ''
      const label = /warning|negative/i.test(cls) ? 'Warning' : 'Tip'
      const lines = content.trim().split('\n')
      return `\n\n> ${label}: ${lines[0]}\n${lines.slice(1).map((l) => `> ${l}`).join('\n')}\n\n`
    },
  })

  // CLaaT writes code as <pre><code class="language-bash">, or with no language.
  td.addRule('code', {
    filter: (node) => node.nodeName === 'PRE',
    replacement: (_content, node) => {
      const code = (node as HTMLElement).querySelector('code') || node
      const cls = (code as HTMLElement).getAttribute?.('class') || (code as HTMLElement).getAttribute?.('language') || ''
      const lang = (cls.match(/language-([\w+#-]+)/) || [])[1] || ''
      const text = (code.textContent || '').replace(/\n$/, '')
      const fence = text.includes('```') ? '~~~' : '```'
      return `\n\n${fence}${lang}\n${text}\n${fence}\n\n`
    },
  })

  // CLaaT tables have no header cells, so the first row becomes the header.
  td.addRule('tables', {
    filter: 'table',
    replacement: (_content, node) => {
      const rows = Array.from((node as HTMLElement).querySelectorAll('tr')).map((tr) =>
        Array.from(tr.querySelectorAll('td,th')).map((cell) =>
          td.turndown((cell as HTMLElement).innerHTML).replace(/\n+/g, ' ').replace(/\|/g, '\\|').trim(),
        ),
      )
      if (!rows.length) return ''
      const width = Math.max(...rows.map((r) => r.length))
      const line = (r: string[]) => `| ${Array.from({ length: width }, (_, i) => r[i] ?? '').join(' | ')} |`
      return `\n\n${line(rows[0])}\n| ${Array(width).fill('---').join(' | ')} |\n${rows.slice(1).map(line).join('\n')}\n\n`
    },
  })

  td.remove(['script', 'style'])
  return td
}

/**
 * @param html  the exported index.html
 * @param json  optional contents of codelab.json (gives the summary and authors)
 */
export function convertClaatHtml(html: string, json?: string): string {
  let meta: ClaatMeta = {}
  if (json) {
    try {
      meta = JSON.parse(json)
    } catch {
      /* ignore a broken codelab.json */
    }
  }
  const root = html.match(/<google-codelab\b[^>]*>/i)?.[0] ?? ''
  const title = meta.title || attr(root, 'title') || html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || 'Untitled lab'
  const author = (meta.authors || '').split(',')[0].trim()

  const td = makeTurndown()
  const steps: string[] = []
  const stepRe = /<google-codelab-step\b([^>]*)>([\s\S]*?)<\/google-codelab-step>/gi
  let m: RegExpExecArray | null
  let n = 0
  let first = true
  while ((m = stepRe.exec(html))) {
    const label = stripStepPrefix(attr(m[1], 'label') || `Step ${steps.length + 1}`)
    const duration = attr(m[1], 'duration')
    n = first ? (INTRO.test(label) ? 0 : 1) : n + 1
    first = false
    const body = td.turndown(m[2]).trim()
    steps.push([`## Step ${n}: ${label}`, ...(duration ? [`Duration: ${duration}`] : []), '', body].join('\n'))
  }

  const out = ['---', `title: ${decode(title)}`, ...(author ? [`author: ${author}`] : []), '---', '', `# ${decode(title)}`, '']
  if (meta.summary) out.push(meta.summary, '')
  return (out.join('\n') + '\n' + steps.join('\n\n') + '\n').replace(/^(\s*)([-*]|\d+\.)\s{2,}/gm, '$1$2 ').replace(/\n{3,}/g, '\n\n')
}
