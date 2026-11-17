import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type TouchEvent } from 'react'
import type { Copyright, Lab } from '../lib/parser'
import { sanitize } from '../lib/sanitize'
import { applyAssets, type Assets } from '../lib/assets'
import { wireDecks } from '../lib/deck'
import { linkedinText, slugify } from '../lib/parser'
import { exportLabHtml } from '../lib/exportHtml'
import { downloadFile } from '../lib/storage'
import { Congrats } from './Congrats'
import { Logo } from './Logo'
import { NavLinks, type NavActions } from './NavLinks'
import { ThemeToggle } from './ThemeToggle'


const readHash = () => {
  const m = location.hash.match(/^#step-(\d+)$/)
  return m ? Number(m[1]) - 1 : 0
}

interface Props {
  lab: Lab
  source: string
  onSourceChange: (s: string) => void
  nav: NavActions
  /** Images uploaded together with the .md */
  assets?: Assets
  onAddImages?: () => void
}

export function Viewer({ lab, source, onSourceChange, nav, assets = {}, onAddImages }: Props) {
  const onExit = nav.onHome
  const [index, setIndex] = useState(readHash)
  const [editing, setEditing] = useState(false)
  const [done, setDone] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const article = useRef<HTMLElement>(null)

  const steps = lab.steps
  const count = steps.length
  const i = Math.max(0, Math.min(index, count - 1))
  const step = steps[i]
  const last = i === count - 1

  const clean = useCallback((html: string) => applyAssets(sanitize(html), assets), [assets])
  const safeHtml = useMemo(() => steps.map((s) => clean(s.html)), [steps, clean])
  const [broken, setBroken] = useState<string[]>([])
  const minutesLeft = steps.slice(i).reduce((a, s) => a + s.duration, 0)

  const go = useCallback(
    (n: number) => {
      const next = Math.max(0, Math.min(n, count - 1))
      setIndex(next)
      history.replaceState(null, '', `${location.pathname}${location.search}${next ? `#step-${next + 1}` : ''}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [count],
  )

  useEffect(() => {
    document.title = lab.title
  }, [lab.title])

  useEffect(() => wireDecks(document), [])

  // Images that fail to load (usually: files on your computer that weren't uploaded with the .md)
  useEffect(() => {
    setBroken([])
    const root = article.current
    if (!root) return
    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('.prose img')).filter(
      (im) => !im.closest('.deck-thumb') && !/^(https?:|data:|blob:)/i.test(im.getAttribute('src') || ''),
    )
    const mark = (im: HTMLImageElement) =>
      setBroken((b) => {
        const name = (im.getAttribute('src') || '').split('/').pop() || ''
        return b.includes(name) ? b : [...b, name]
      })
    const handlers = imgs.map((im) => {
      const h = () => mark(im)
      if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) mark(im)
      im.addEventListener('error', h)
      return () => im.removeEventListener('error', h)
    })
    return () => handlers.forEach((off) => off())
  }, [i, safeHtml])

  useEffect(() => {
    const onHash = () => setIndex(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || editing || !count) return
      const t = e.target as HTMLElement
      if (t.closest('textarea,input,[data-deck]')) return
      if (e.key === 'ArrowRight') (last ? setDone(true) : go(i + 1))
      if (e.key === 'ArrowLeft' && i > 0) go(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, editing, count, last, i, go])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  // Copy buttons inside rendered markdown
  const onArticleClick = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest('.copy') as HTMLButtonElement | null
    if (!btn) return
    const code = btn.closest('.code')?.querySelector('pre')?.innerText ?? ''
    navigator.clipboard.writeText(code).then(
      () => {
        btn.textContent = 'Copied'
        setTimeout(() => (btn.textContent = 'Copy'), 1500)
      },
      () => setToast('Copy was blocked here. Select the code and copy it.'),
    )
  }

  // Swipe left/right on phones to move between steps (ignored inside scrollable code blocks)
  const touch = useRef<{ x: number; y: number; t: number } | null>(null)
  const onTouchStart = (e: TouchEvent) => {
    const el = e.target as HTMLElement
    if (el.closest('.code, .prose table, .deck, .embed')) {
      touch.current = null
      return
    }
    const p = e.touches[0]
    touch.current = { x: p.clientX, y: p.clientY, t: Date.now() }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start || done || editing) return
    const p = e.changedTouches[0]
    const dx = p.clientX - start.x
    const dy = p.clientY - start.y
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6 || Date.now() - start.t > 600) return
    if (dx < 0) (last ? setDone(true) : go(i + 1))
    else if (i > 0) go(i - 1)
  }

  const downloadHtml = async () => {
    try {
      setToast('Packing images into one file…')
      const html = await exportLabHtml(lab, clean, source)
      downloadFile(`${slugify(lab.title)}.html`, html, 'text/html')
      setToast('Downloaded a single HTML file. Open it anywhere.')
    } catch {
      setToast('Downloads are blocked in this preview. Run StepLab locally or on GitHub Pages.')
    }
  }

  const closeDone = useCallback(() => setDone(false), [])
  const restart = useCallback(() => {
    setDone(false)
    go(0)
  }, [go])

  return (
    <div className={`viewer${editing ? ' with-editor' : ''}`}>
      <header className="bar">
        <button className="bar-brand" onClick={onExit} aria-label="Back to StepLab home">
          <Logo size={24} />
        </button>
        <NavLinks {...nav} variant="lab" />
        <div className="bar-actions">
          <button
            className={`btn btn-bar${editing ? ' active' : ''}`}
            onClick={() => setEditing((v) => !v)}
            aria-pressed={editing}
            aria-label="Edit markdown"
          >
            <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />
            </svg>
            <span className="lbl">Edit</span>
          </button>
          <button className="btn btn-red" onClick={downloadHtml} disabled={!count} aria-label="Download HTML">
            <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />
            </svg>
            <span className="lbl">Download HTML</span>
          </button>
          <ThemeToggle className="bar-theme" />
        </div>
      </header>
      <div className="progress" aria-hidden="true">
        <i style={{ width: count ? `${((i + 1) / count) * 100}%` : 0 }} />
      </div>

      <div className="layout">
        <div className="lab-head">
          <h1>{lab.title}</h1>
          {count > 0 && (
            <p>
              {step?.label} of {steps[count - 1]?.badge}
              {minutesLeft > 0 && ` · ${minutesLeft} min left`}
            </p>
          )}
        </div>
        <nav className="rail" aria-label="Steps">
          <ol>
            {steps.map((s, n) => (
              <li key={n} className={n === i ? 'on' : n < i ? 'done' : ''}>
                <button onClick={() => go(n)} aria-current={n === i ? 'step' : undefined} aria-label={`${s.label}: ${s.title}`}>
                  <span className="dot">{n < i ? '✓' : s.badge}</span>
                  <span className="rail-text">
                    <span className="rail-title">{s.title}</span>
                    {s.duration > 0 && <small>{s.duration} min</small>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {lab.warnings.length > 0 && i === 0 && (
            <div className="warn-box" role="status">
              {lab.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}
          {broken.length > 0 && (
            <div className="warn-box img-hint" role="status">
              <p>
                <b>
                  {broken.length} image{broken.length > 1 ? 's' : ''} didn't load
                </b>{' '}
                ({broken.slice(0, 3).join(', ')}
                {broken.length > 3 ? '…' : ''}). If they're on your computer, add them, or use full https:// image
                links in the .md.
              </p>
              {onAddImages && (
                <button className="btn btn-small" onClick={onAddImages}>
                  Add images
                </button>
              )}
            </div>
          )}
          {step ? (
            <article className="sheet" ref={article} key={i} onClick={onArticleClick}>
              {lab.copyright && lab.copyright.position !== 'bottom' && <CopyrightLine c={lab.copyright} where="top" />}
              <p className="kicker">
                {step.label}
                {step.duration > 0 && <span className="chip">{step.duration} min</span>}
              </p>
              <h2>{step.title}</h2>
              <div className="prose" dangerouslySetInnerHTML={{ __html: safeHtml[i] }} />
              {i === 0 && lab.author && !lab.copyright && <p className="byline">Written by {lab.author}</p>}
              {lab.copyright && lab.copyright.position !== 'top' && <CopyrightLine c={lab.copyright} where="bottom" />}
            </article>
          ) : (
            <article className="sheet">
              <h2>No steps found</h2>
              <p className="prose">
                Start each step with a heading like <code>## Step 1: Set up</code>. Open <b>Edit</b> to fix the file.
              </p>
            </article>
          )}
        </main>

        {editing && (
          <aside className="editor" aria-label="Markdown editor">
            <div className="editor-head">
              <h2>Edit markdown</h2>
              <div>
                <button className="btn btn-small" onClick={() => downloadFile(`${slugify(lab.title)}.md`, source, 'text/markdown')}>
                  Save .md
                </button>
                <button className="btn btn-small btn-done" onClick={() => setEditing(false)} aria-label="Close editor and show the lab">
                  Done
                </button>
              </div>
            </div>
            <textarea value={source} onChange={(e) => onSourceChange(e.target.value)} spellCheck={false} aria-label="Lab markdown" />
            <p className="editor-hint">Changes show up in the lab as you type.</p>
          </aside>
        )}
      </div>

      {count > 0 && (
        <footer className="pager">
          <button className="btn btn-outline" onClick={() => (i === 0 ? onExit() : go(i - 1))}>
            {i === 0 ? '← Home' : '← Back'}
          </button>
          <div className="pager-dots" aria-hidden="true">
            {steps.map((_, n) => (
              <i key={n} className={n === i ? 'on' : n < i ? 'done' : ''} />
            ))}
          </div>
          <button className={`btn ${last ? 'btn-red' : 'btn-ink'}`} onClick={() => (last ? setDone(true) : go(i + 1))}>
            {last ? 'Finish ✓' : 'Next →'}
          </button>
        </footer>
      )}

      {done && <Congrats lab={lab} onClose={closeDone} onRestart={restart} />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

function CopyrightLine({ c, where }: { c: Copyright; where: 'top' | 'bottom' }) {
  return (
    <p className={`copyright copyright-${where}`}>
      <span>{c.text}</span>
      {c.linkedin && (
        <a href={c.linkedin} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4z" />
          </svg>
          {linkedinText(c.linkedin)}
        </a>
      )}
    </p>
  )
}
