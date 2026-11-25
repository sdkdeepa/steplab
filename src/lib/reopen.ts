/**
 * Reads a lab downloaded from StepLab (one .html file) back into its markdown and images.
 *
 * Every StepLab download carries its markdown in
 *   <script type="application/json" id="steplab-source">…</script>
 * and each image as a data URL, with its original path in data-src.
 *
 * Works without a DOM, so the website and the editor extension (Node) share it.
 */

export type ReopenError = 'not-steplab' | 'old-version' | 'damaged'

export interface ReopenedImage {
  /** The path the markdown uses, e.g. "img/terms.png" or "https://…/a.png". */
  path: string
  /** The image itself, as a data: URL. */
  dataUrl: string
}

export type Reopened = { ok: true; markdown: string; images: ReopenedImage[] } | { ok: false; reason: ReopenError }

const decodeEntities = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|quot|amp|lt|gt|apos|#39);/gi, (all, e: string) => {
    const k = e.toLowerCase()
    if (k === 'quot') return '"'
    if (k === 'amp') return '&'
    if (k === 'lt') return '<'
    if (k === 'gt') return '>'
    if (k === 'apos' || k === '#39') return "'"
    const n = k.startsWith('#x') ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10)
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : all
  })

/** Attributes of one start tag, e.g. `<img src="a" data-src='b'>` → { src: 'a', 'data-src': 'b' }. */
function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  // skip the tag name
  const body = tag.replace(/^<\s*[a-z0-9-]+/i, '').replace(/\/?>$/, '')
  for (const m of body.matchAll(re)) {
    const name = m[1].toLowerCase()
    if (!(name in out)) out[name] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '')
  }
  return out
}

const isStepLabDownload = (html: string) =>
  [...html.matchAll(/<meta\b[^>]*>/gi)].some((m) => {
    const a = attrs(m[0])
    return a.name?.toLowerCase() === 'generator' && a.content === 'StepLab'
  })

export function reopenStepLabHtml(html: string): Reopened {
  if (!isStepLabDownload(html)) return { ok: false, reason: 'not-steplab' }

  // The JSON escapes every "<" as \u003c, so the first </script> after it is its end.
  const open = [...html.matchAll(/<script\b[^>]*>/gi)].find((m) => attrs(m[0]).id === 'steplab-source')
  if (!open) return { ok: false, reason: 'old-version' }
  const start = open.index! + open[0].length
  const end = html.toLowerCase().indexOf('</script', start)
  if (end < 0) return { ok: false, reason: 'damaged' }
  const json = html.slice(start, end).trim()
  if (!json) return { ok: false, reason: 'old-version' }

  let markdown: unknown
  try {
    markdown = JSON.parse(json)
  } catch {
    return { ok: false, reason: 'damaged' }
  }
  if (typeof markdown !== 'string') return { ok: false, reason: 'damaged' }

  const images: ReopenedImage[] = []
  const seen = new Set<string>()
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const a = attrs(m[0])
    const path = a['data-src']
    const src = a.src ?? ''
    if (!path || !src.startsWith('data:') || seen.has(path)) continue
    seen.add(path)
    images.push({ path, dataUrl: src })
  }
  return { ok: true, markdown, images }
}

/** A data: URL as bytes (base64 or percent-encoded). Null if it isn't one. */
export function dataUrlBytes(dataUrl: string): Uint8Array | null {
  const m = dataUrl.match(/^data:([^,]*?),(.*)$/s)
  if (!m) return null
  try {
    if (/;base64$/i.test(m[1])) {
      const bin = atob(m[2].replace(/\s+/g, ''))
      const out = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
      return out
    }
    return new TextEncoder().encode(decodeURIComponent(m[2]))
  } catch {
    return null
  }
}

/**
 * Where an image from a reopened lab can be written, relative to the .md file's folder.
 * Only plain relative paths that stay inside that folder ("img/a.png", "./a.png").
 * Null for links, absolute paths and anything that climbs out ("../", "C:\").
 */
export function safeImagePath(p: string): string | null {
  let s = p.split(/[?#]/)[0]
  try {
    s = decodeURIComponent(s)
  } catch {
    /* keep */
  }
  s = s.replace(/\\/g, '/')
  if (!s || /^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('/') || s.startsWith('//')) return null
  const parts: string[] = []
  for (const part of s.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') return null
    if (/[\0<>:"|?*]/.test(part)) return null
    parts.push(part)
  }
  if (!parts.length) return null
  if (!/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(parts[parts.length - 1])) return null
  return parts.join('/')
}
