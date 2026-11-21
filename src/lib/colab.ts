/**
 * Optional Colab notebook for a lab: attendees open it in Google Colab with one click
 * and get their own editable copy (free, in the browser, with a Google account).
 *
 * Front matter, any of these:
 *   colab: https://github.com/your-name/your-repo/blob/main/notebooks/lab.ipynb
 *   colab: https://colab.research.google.com/github/your-name/your-repo/blob/main/notebooks/lab.ipynb
 *   colab: https://colab.research.google.com/drive/FILE_ID
 *   colab: https://drive.google.com/file/d/FILE_ID/view
 *
 * GitHub notebooks must be public. Drive notebooks must be shared with "Anyone with the link".
 */
export interface Colab {
  /** The link the "Open in Colab" button opens. */
  url: string
  /** Where the notebook lives, for the button's tooltip. */
  source: 'github' | 'drive'
}

const OWNER = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})'
const REPO = '[A-Za-z0-9._-]{1,100}'
// Branch and folder names: letters, numbers and common URL-safe characters. Must end in .ipynb.
const PATH = "[A-Za-z0-9._~%+\\-/]+\\.ipynb"
const GITHUB = new RegExp(
  `^https?://(?:www\\.)?(?:github\\.com|colab\\.research\\.google\\.com/github)/(${OWNER})/(${REPO})/blob/(${PATH})/?(?:[?#].*)?$`,
  'i',
)
const DRIVE_ID = '[A-Za-z0-9_-]{10,}'
const COLAB_DRIVE = new RegExp(`^https?://colab\\.research\\.google\\.com/drive/(${DRIVE_ID})/?(?:[?#].*)?$`, 'i')
const DRIVE_FILE = new RegExp(`^https?://drive\\.google\\.com/(?:file/d/(${DRIVE_ID})|open\\?id=(${DRIVE_ID}))`, 'i')

/** Turns the front-matter value into a Colab link, or null when it isn't a notebook link we recognize. */
export function readColab(value: string | undefined): Colab | null {
  const v = (value || '').trim()
  if (!v || /^(none|off|false|no)$/i.test(v)) return null

  const gh = v.match(GITHUB)
  if (gh) {
    const path = gh[3]
    if (path.split('/').some((part) => part === '..' || part === '.' || part === '')) return null
    return { url: `https://colab.research.google.com/github/${gh[1]}/${gh[2]}/blob/${path}`, source: 'github' }
  }

  const cd = v.match(COLAB_DRIVE)
  if (cd) return { url: `https://colab.research.google.com/drive/${cd[1]}`, source: 'drive' }

  const df = v.match(DRIVE_FILE)
  if (df) return { url: `https://colab.research.google.com/drive/${df[1] || df[2]}`, source: 'drive' }

  return null
}

/** Button text, shared by the website, the downloaded HTML and the editor preview. */
export const COLAB_LABEL = 'Open in Colab'
export const COLAB_TITLE = 'Opens your own copy of the notebook in Google Colab'

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A notebook icon (generic, not Google's logo). */
export const COLAB_ICON_PATHS = '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12 8h4M12 12h4"/>'

/**
 * The button as plain HTML, for the downloaded lab and the editor preview.
 * (The website builds the same button in React, in Viewer.tsx.)
 * It reuses the sandbox button's look (class "sandbox-btn") so both buttons match.
 */
export function colabButtonHtml(colab: Colab | null, newTab = true): string {
  if (!colab) return ''
  const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
  return `<a class="sandbox-btn colab-btn" href="${escAttr(colab.url)}"${target} title="${escAttr(COLAB_TITLE)}"><svg viewBox="0 0 24 24" aria-hidden="true">${COLAB_ICON_PATHS}</svg>${escAttr(COLAB_LABEL)}<small>Notebook</small></a>`
}
