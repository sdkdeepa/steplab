/** YouTube, Google Slides, PowerPoint and image-deck helpers. Pure functions, no DOM. */

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const YT_HOSTS = /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be)$/i

/** Returns { id, start } for any common YouTube URL, or null. */
export function parseYouTube(raw: string): { id: string; start: number } | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (!YT_HOSTS.test(url.hostname)) return null
  let id = ''
  if (/youtu\.be$/i.test(url.hostname)) id = url.pathname.slice(1).split('/')[0]
  else if (url.pathname === '/watch') id = url.searchParams.get('v') || ''
  else {
    const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)
    if (m) id = m[1]
  }
  if (!/^[\w-]{11}$/.test(id)) return null
  const t = url.searchParams.get('t') || url.searchParams.get('start') || ''
  let start = 0
  const hms = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/)
  if (hms) start = Number(hms[1] || 0) * 3600 + Number(hms[2] || 0) * 60 + Number(hms[3] || 0)
  return { id, start }
}

export function youTubeHtml(raw: string, title = ''): string | null {
  const yt = parseYouTube(raw)
  if (!yt) return null
  const src = `https://www.youtube-nocookie.com/embed/${yt.id}?rel=0${yt.start ? `&start=${yt.start}` : ''}`
  const watch = `https://www.youtube.com/watch?v=${yt.id}${yt.start ? `&t=${yt.start}s` : ''}`
  const label = title || 'YouTube video'
  return `<figure class="embed embed-video"><div class="frame"><iframe src="${src}" title="${esc(label)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><figcaption><span>${esc(title || 'Video')}</span><a href="${esc(watch)}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></figcaption></figure>`
}

/** Converts a Google Slides / PowerPoint link into an embeddable URL, or null. */
export function presentationEmbed(raw: string): { src: string; kind: 'google' | 'powerpoint'; open: string } | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  if (host === 'docs.google.com' && url.pathname.startsWith('/presentation/')) {
    // /presentation/d/e/<pubId>/pub|embed|pubembed  or  /presentation/d/<id>/edit|view|preview
    const pub = url.pathname.match(/^\/presentation\/d\/e\/([\w-]+)/)
    const doc = url.pathname.match(/^\/presentation\/d\/([\w-]+)/)
    const src = pub
      ? `https://docs.google.com/presentation/d/e/${pub[1]}/embed?start=false&loop=false&delayms=3000`
      : doc
        ? `https://docs.google.com/presentation/d/${doc[1]}/embed?start=false&loop=false&delayms=3000`
        : ''
    return src ? { src, kind: 'google', open: url.toString() } : null
  }
  if (host === 'onedrive.live.com' && url.pathname.startsWith('/embed'))
    return { src: url.toString(), kind: 'powerpoint', open: url.toString() }
  if (/\.sharepoint\.com$/.test(host) && /action=embedview/i.test(url.search))
    return { src: url.toString(), kind: 'powerpoint', open: url.toString() }
  if (host === 'view.officeapps.live.com' && url.pathname.startsWith('/op/'))
    return { src: url.toString().replace('/op/view.aspx', '/op/embed.aspx'), kind: 'powerpoint', open: url.toString() }
  if (/\.(pptx?|ppsx?)$/i.test(url.pathname) && url.protocol === 'https:')
    return {
      src: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url.toString())}`,
      kind: 'powerpoint',
      open: url.toString(),
    }
  return null
}

/** Hosts allowed inside <iframe src>. Everything else is removed by the sanitizer. */
export const IFRAME_ALLOW = [
  /^https:\/\/www\.youtube-nocookie\.com\/embed\//,
  /^https:\/\/docs\.google\.com\/presentation\//,
  /^https:\/\/onedrive\.live\.com\/embed/,
  /^https:\/\/[\w-]+\.sharepoint\.com\//,
  /^https:\/\/view\.officeapps\.live\.com\/op\/embed\.aspx/,
]

/**
 * ```slides block body. Lines:
 *   title: Optional deck title
 *   https://docs.google.com/presentation/...   -> live embed (uses the tool's own arrows)
 *   images/slide-1.png | optional caption       -> image deck with StepLab's arrows
 */
export function slidesHtml(body: string): string {
  let title = ''
  const slides: { src: string; caption: string }[] = []
  let embed: ReturnType<typeof presentationEmbed> = null
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const t = line.match(/^title\s*:\s*(.+)$/i)
    if (t) {
      title = t[1].trim()
      continue
    }
    const [src, ...cap] = line.replace(/^[-*]\s+/, '').split('|')
    const e = presentationEmbed(src)
    if (e) {
      embed = e
      continue
    }
    if (/^(https?:\/\/|\.{0,2}\/|[\w-])[^\s"'<>]*\.(png|jpe?g|gif|webp|svg|avif)(\?[^\s"'<>]*)?$/i.test(src.trim()))
      slides.push({ src: src.trim(), caption: cap.join('|').trim() })
  }

  if (embed) {
    const name = embed.kind === 'google' ? 'Google Slides' : 'PowerPoint'
    return `<figure class="embed embed-slides"><div class="frame"><iframe src="${esc(embed.src)}" title="${esc(title || name + ' presentation')}" loading="lazy" allowfullscreen></iframe></div><figcaption><span>${esc(title || name)}</span><a href="${esc(embed.open)}" target="_blank" rel="noopener noreferrer">Open in ${name} ↗</a></figcaption></figure>`
  }
  if (!slides.length)
    return `<aside class="callout callout-warning"><strong class="callout-label">Slides</strong><p>No slides found. Add image paths (one per line) or a Google Slides / PowerPoint embed link.</p></aside>`

  const n = slides.length
  const imgs = slides
    .map(
      (s, i) =>
        `<img src="${esc(s.src)}" alt="${esc(s.caption || `${title || 'Slide'} ${i + 1} of ${n}`)}" data-caption="${esc(s.caption)}"${i ? ' hidden' : ''} loading="${i < 2 ? 'eager' : 'lazy'}">`,
    )
    .join('')
  const thumbs = slides
    .map(
      (s, i) =>
        `<button type="button" class="deck-thumb${i ? '' : ' on'}" data-go="${i}" aria-label="Go to slide ${i + 1}"><img src="${esc(s.src)}" alt="" loading="lazy"></button>`,
    )
    .join('')
  return `<figure class="deck" data-deck tabindex="0" aria-roledescription="slide deck" aria-label="${esc(title || 'Slides')}"><div class="deck-stage">${imgs}<button type="button" class="deck-btn deck-prev" aria-label="Previous slide" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="deck-btn deck-next" aria-label="Next slide"${n < 2 ? ' disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div><figcaption class="deck-bar"><span class="deck-title">${esc(title || 'Slides')}</span><span class="deck-cap">${esc(slides[0].caption)}</span><span class="deck-count" aria-live="polite">1 / ${n}</span><button type="button" class="deck-full" aria-label="Full screen">⛶</button></figcaption><div class="deck-thumbs">${thumbs}</div></figure>`
}
