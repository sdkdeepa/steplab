/**
 * Optional sandbox for a lab: a GitHub repo with a .devcontainer that attendees
 * open in GitHub Codespaces with one click.
 *
 * Front matter:
 *   sandbox: your-name/your-sandbox-repo
 *
 * Also accepted: https://github.com/your-name/your-sandbox-repo
 * and https://codespaces.new/your-name/your-sandbox-repo
 */
export interface Sandbox {
  /** "owner/repo" */
  repo: string
  /** The link the "Launch sandbox" button opens. */
  url: string
}

// GitHub user and org names: letters, numbers and single hyphens. Repo names also allow "." and "_".
const OWNER = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})'
const REPO = '[A-Za-z0-9._-]{1,100}'
const SHAPE = new RegExp(`^(?:https?://(?:www\\.)?(?:github\\.com|codespaces\\.new)/)?(${OWNER})/(${REPO})/?(?:[?#].*)?$`, 'i')

/** Turns the front-matter value into a Codespaces link, or null when it isn't a GitHub repo. */
export function readSandbox(value: string | undefined): Sandbox | null {
  const v = (value || '').trim()
  if (!v || /^(none|off|false|no)$/i.test(v)) return null
  const m = v.match(SHAPE)
  const name = m ? m[2].replace(/\.git$/i, '') : ''
  if (!m || !name || name === '.' || name === '..') return null
  const repo = `${m[1]}/${name}`
  return { repo, url: `https://codespaces.new/${repo}?quickstart=1` }
}

/** Button text, shared by the website, the downloaded HTML and the editor preview. */
export const SANDBOX_LABEL = 'Launch sandbox'
export const SANDBOX_TITLE = 'Opens a ready-to-use coding environment in GitHub Codespaces'

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * The button as plain HTML, for the downloaded lab and the editor preview.
 * (The website builds the same button in React, in Viewer.tsx.)
 * `newTab` adds target="_blank"; the editor preview leaves it out and opens links in the browser itself.
 */
export function sandboxButtonHtml(sandbox: Sandbox | null, newTab = true): string {
  if (!sandbox) return ''
  const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
  return `<a class="sandbox-btn" href="${escAttr(sandbox.url)}"${target} title="${escAttr(SANDBOX_TITLE)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 10 3 2-3 2M12 15h5"/></svg>${escAttr(SANDBOX_LABEL)}<small>Codespaces</small></a>`
}
