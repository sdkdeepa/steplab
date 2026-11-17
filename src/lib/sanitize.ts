import DOMPurify from 'dompurify'
import { IFRAME_ALLOW } from './embeds'

let ready = false

function setup() {
  if (ready) return
  ready = true
  // Only allow-listed embeds (YouTube, Google Slides, PowerPoint) survive.
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const src = (node as Element).getAttribute?.('src') || ''
      if (!IFRAME_ALLOW.some((re) => re.test(src))) node.parentNode?.removeChild(node)
    }
  })
}

export function sanitize(html: string): string {
  setup()
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy', 'aria-roledescription'],
  })
}
