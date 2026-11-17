import { Marked, type Tokens } from 'marked'
import hljs from 'highlight.js/lib/common'
import dart from 'highlight.js/lib/languages/dart'
import groovy from 'highlight.js/lib/languages/groovy'
import gradle from 'highlight.js/lib/languages/gradle'
import { slidesHtml, youTubeHtml, parseYouTube } from './embeds'

// Extra languages for mobile labs (Flutter, Android build files)
hljs.registerLanguage('dart', dart)
hljs.registerLanguage('groovy', groovy)
hljs.registerLanguage('gradle', gradle)

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const CALLOUT = /^(note|tip|warning|caution)\s*:\s*/i
const ASIDE = /^aside\s+(positive|negative)\b/i

const marked = new Marked({
  gfm: true,
  renderer: {
    code({ text, lang }: Tokens.Code) {
      const language = (lang || '').trim().split(/\s+/)[0]
      const kind = language.toLowerCase()
      if (kind === 'slides' || kind === 'slide' || kind === 'deck') return slidesHtml(text)
      if (kind === 'youtube' || kind === 'video') {
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
        const title = (lines.find((l) => /^title\s*:/i.test(l)) || '').replace(/^title\s*:\s*/i, '')
        const url = lines.find((l) => /^https?:\/\//i.test(l)) || ''
        return (
          youTubeHtml(url, title) ??
          `<aside class="callout callout-warning"><strong class="callout-label">Video</strong><p>That doesn't look like a YouTube link: ${escape(url || text)}</p></aside>`
        )
      }
      const known = language && hljs.getLanguage(language)
      const body = known
        ? hljs.highlight(text, { language, ignoreIllegals: true }).value
        : escape(text)
      const label = language || 'code'
      return `<div class="code"><div class="code-bar"><span>${escape(label)}</span><button type="button" class="copy">Copy</button></div><pre><code class="hljs">${body}</code></pre></div>`
    },
    blockquote({ tokens }: Tokens.Blockquote) {
      const first = tokens[0]
      if (first && first.type === 'paragraph') {
        const text = (first as Tokens.Paragraph).text
        // "> Note: …", "> Tip: …", "> Warning: …", and "> aside positive" / "> aside negative"
        const m = text.match(CALLOUT)
        const aside = text.match(ASIDE)
        if (m || aside) {
          const kind = aside
            ? aside[1].toLowerCase() === 'negative' ? 'warning' : 'tip'
            : /warn|caution/i.test(m![1]) ? 'warning' : m![1].toLowerCase() === 'tip' ? 'tip' : 'note'
          const label = kind === 'warning' ? 'Warning' : kind === 'tip' ? 'Tip' : 'Note'
          const strip = aside ? new RegExp(`(<p>)\\s*aside\\s+${aside[1]}\\b[:\\s]*`, 'i') : new RegExp(`(<p>)\\s*${m![1]}\\s*:\\s*`, 'i')
          const inner = this.parser.parse(tokens).replace(strip, '$1').replace(/<p>\s*<\/p>/g, '')
          return `<aside class="callout callout-${kind}"><strong class="callout-label">${label}</strong>${inner}</aside>`
        }
      }
      return `<blockquote>${this.parser.parse(tokens)}</blockquote>`
    },
    paragraph({ tokens, text }: Tokens.Paragraph) {
      // A YouTube link on its own line becomes a video player.
      const bare = text.trim()
      if (/^<?https?:\/\/\S+>?$/.test(bare)) {
        const video = youTubeHtml(bare.replace(/^<|>$/g, ''))
        if (video) return video
      }
      const only = tokens.filter((t) => !(t.type === 'text' && !t.raw.trim()))
      if (only.length === 1 && only[0].type === 'image' && (only[0] as Tokens.Image).title)
        return this.parser.parseInline(only)
      return `<p>${this.parser.parseInline(tokens)}</p>\n`
    },
    image({ href, title, text }: Tokens.Image) {
      const img = `<img src="${escape(href)}" alt="${escape(text)}" loading="lazy">`
      return title ? `<figure class="figure">${img}<figcaption>${escape(title)}</figcaption></figure>` : img
    },
    link({ href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens)
      const t = title ? ` title="${escape(title)}"` : ''
      // [![title](thumbnail)](youtube link) -> a video preview card with a play button
      if (/<img\b/i.test(text) && parseYouTube(href)) {
        const alt = (text.match(/\balt="([^"]*)"/i) || [])[1] || ''
        return `<a class="yt-thumb" href="${escape(href)}" target="_blank" rel="noopener noreferrer"><span class="yt-frame">${text}<span class="yt-play" aria-hidden="true"></span></span>${alt ? `<span class="yt-cap"><b>${alt}</b><span>Watch on YouTube ↗</span></span>` : ''}</a>`
      }
      // #step-3 style links jump between steps in the same lab
      if (href.startsWith('#')) return `<a href="${escape(href)}"${t}>${text}</a>`
      return `<a href="${escape(href)}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`
    },
  },
})

/** Markdown -> HTML (not sanitized; sanitize in the browser before inserting). */
export function renderMarkdown(src: string): string {
  return marked.parse(src, { async: false }) as string
}
