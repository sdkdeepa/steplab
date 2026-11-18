/**
 * Runs inside the VS Code / Antigravity preview panel.
 * Reuses the web app's code (../../src/lib) so the preview matches the website exactly.
 */
import confetti from 'canvas-confetti'
import { parseLab, slugify, linkedinText, type Lab, type Copyright } from '../../src/lib/parser'
import { sanitize } from '../../src/lib/sanitize'
import { wireDecks } from '../../src/lib/deck'
import { exportLabHtml } from '../../src/lib/exportHtml'
import { sandboxButtonHtml } from '../../src/lib/sandbox'
import '../../src/styles.css'
import '../../src/sandbox.css'
import './webview.css'

declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void
  getState(): { index?: number } | undefined
  setState(s: { index: number }): void
}
const vscode = acquireVsCodeApi()

type FromHost =
  | { type: 'update'; text: string; fileName: string }
  | { type: 'goto'; index: number }
  | { type: 'export' }

let lab: Lab | null = null
let index = vscode.getState()?.index ?? 0
let lastText = ''

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const $ = (id: string) => document.getElementById(id)!

/* Follow VS Code's light/dark theme */
function syncTheme() {
  const dark = document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}
new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] })
syncTheme()

function copyright(c: Copyright, where: 'top' | 'bottom') {
  const link = c.linkedin
    ? `<a href="${esc(c.linkedin)}">${esc(linkedinText(c.linkedin))}</a>`
    : ''
  return `<p class="copyright copyright-${where}"><span>${esc(c.text)}</span>${link}</p>`
}

function render(keepScroll = false) {
  const root = $('app')
  if (!lab) return
  const steps = lab.steps
  if (!steps.length) {
    root.innerHTML = `<div class="empty"><h2>No steps yet</h2><p>Start each step with a heading like <code>## Step 0: Overview</code> or <code>## Step 1: Set up</code>.</p><p>Run <b>StepLab: New Lab from Template</b> to see every feature.</p></div>`
    return
  }
  index = Math.max(0, Math.min(index, steps.length - 1))
  vscode.setState({ index })
  const s = steps[index]
  const last = index === steps.length - 1
  const left = steps.slice(index).reduce((a, x) => a + x.duration, 0)
  const c = lab.copyright
  const scrollY = window.scrollY

  root.innerHTML = `
  <div class="layout">
    <div class="lab-head">
      <h1>${esc(lab.title)}</h1>
      <p>${esc(s.label)} of ${esc(steps[steps.length - 1].badge)}${left ? ` · ${left} min left` : ''}</p>
      ${lab.sandbox ? `<div class="sandbox-row">${sandboxButtonHtml(lab.sandbox, false)}</div>` : ''}
    </div>
    <nav class="rail" aria-label="Steps"><ol>${steps
      .map(
        (x, n) =>
          `<li class="${n === index ? 'on' : n < index ? 'done' : ''}"><button data-go="${n}" aria-label="${esc(x.label)}: ${esc(x.title)}"><span class="dot">${n < index ? '✓' : esc(x.badge)}</span><span class="rail-text"><span class="rail-title">${esc(x.title)}</span>${x.duration ? `<small>${x.duration} min</small>` : ''}</span></button></li>`,
      )
      .join('')}</ol></nav>
    <main class="stage">
      ${lab.warnings.length && index === 0 ? `<div class="warn-box">${lab.warnings.map((w) => `<p>${esc(w)}</p>`).join('')}</div>` : ''}
      <article class="sheet">
        ${c && c.position !== 'bottom' ? copyright(c, 'top') : ''}
        <p class="kicker">${esc(s.label)}${s.duration ? `<span class="chip">${s.duration} min</span>` : ''}</p>
        <h2>${esc(s.title)}</h2>
        <div class="prose">${sanitize(s.html)}</div>
        ${index === 0 && lab.author && !c ? `<p class="byline">Written by ${esc(lab.author)}</p>` : ''}
        ${c && c.position !== 'top' ? copyright(c, 'bottom') : ''}
      </article>
    </main>
  </div>
  <footer class="pager">
    <button class="btn btn-outline" data-act="prev"${index === 0 ? ' disabled' : ''}>← Back</button>
    <div class="pager-dots">${steps.map((_, n) => `<i class="${n === index ? 'on' : n < index ? 'done' : ''}"></i>`).join('')}</div>
    <button class="btn ${last ? 'btn-red' : 'btn-ink'}" data-act="${last ? 'finish' : 'next'}">${last ? 'Finish ✓' : 'Next →'}</button>
  </footer>`
  if (keepScroll) window.scrollTo(0, scrollY)
}

function go(n: number) {
  index = n
  render()
  window.scrollTo({ top: 0 })
  vscode.postMessage({ type: 'step', index })
}

function finish() {
  if (!lab) return
  const scrim = document.createElement('div')
  scrim.className = 'scrim'
  scrim.innerHTML = `<div class="congrats" role="dialog" aria-modal="true"><div class="badge"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="46" fill="#e8251a"/><path d="M31 49l12 12 23-26" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h2>Congratulations!</h2><p>You've finished <strong>${esc(lab.title)}</strong>.</p><div class="congrats-stats"><div><b>${lab.steps.length}</b><span>steps done</span></div>${lab.totalMinutes ? `<div><b>${lab.totalMinutes}</b><span>minutes of hands-on work</span></div>` : ''}</div><div class="congrats-actions"><button class="btn btn-ghost-dark" data-act="restart">Start over</button><button class="btn btn-ink" data-act="close">Close</button></div></div>`
  document.body.appendChild(scrim)
  ;(scrim.querySelector('[data-act="close"]') as HTMLElement).focus()
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ['#e8251a', '#0b0d0f', '#d5dbe0', '#ffb000', '#ffffff'], zIndex: 60 })
}
const closeFinish = () => document.querySelector('.scrim')?.remove()

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement
  const goBtn = t.closest<HTMLElement>('[data-go]')
  if (goBtn) return go(Number(goBtn.dataset.go))
  const act = t.closest<HTMLElement>('[data-act]')?.dataset.act
  if (act === 'prev') go(index - 1)
  else if (act === 'next') go(index + 1)
  else if (act === 'finish') finish()
  else if (act === 'close' || (t.classList.contains('scrim') && !t.closest('.congrats'))) closeFinish()
  else if (act === 'restart') {
    closeFinish()
    go(0)
  }
  // Copy buttons on code blocks
  const copy = t.closest<HTMLButtonElement>('.copy')
  if (copy) {
    const code = copy.closest('.code')?.querySelector('pre')?.textContent ?? ''
    navigator.clipboard.writeText(code).then(() => {
      copy.textContent = 'Copied'
      setTimeout(() => (copy.textContent = 'Copy'), 1500)
    })
  }
  // In-lab links like [see Step 3](#step-3)
  const a = t.closest<HTMLAnchorElement>('a[href^="#step-"]')
  if (a && lab) {
    e.preventDefault()
    const n = Number(a.getAttribute('href')!.slice(6))
    const i = lab.steps.findIndex((s) => s.badge === String(n))
    go(i >= 0 ? i : n - 1)
  }
})

document.addEventListener('keydown', (e) => {
  if (document.querySelector('.scrim')) {
    if (e.key === 'Escape') closeFinish()
    return
  }
  if ((e.target as HTMLElement).closest?.('[data-deck], input, textarea') || !lab?.steps.length) return
  if (e.key === 'ArrowRight') index === lab.steps.length - 1 ? finish() : go(index + 1)
  if (e.key === 'ArrowLeft' && index > 0) go(index - 1)
})

wireDecks(document)

window.addEventListener('message', async (event: MessageEvent<FromHost>) => {
  const msg = event.data
  if (msg.type === 'update') {
    if (msg.text === lastText && lab) return
    lastText = msg.text
    lab = parseLab(msg.text)
    document.title = lab.title
    render(true)
  } else if (msg.type === 'goto') {
    if (lab && msg.index !== index && msg.index >= 0 && msg.index < lab.steps.length) {
      index = msg.index
      render()
      window.scrollTo({ top: 0 })
    }
  } else if (msg.type === 'export') {
    if (!lab || !lab.steps.length) return vscode.postMessage({ type: 'exportError', message: 'This file has no steps yet.' })
    try {
      const html = await exportLabHtml(lab, sanitize, lastText)
      vscode.postMessage({ type: 'exported', html, suggestedName: `${slugify(lab.title)}.html` })
    } catch (err) {
      vscode.postMessage({ type: 'exportError', message: String(err) })
    }
  }
})

vscode.postMessage({ type: 'ready' })

