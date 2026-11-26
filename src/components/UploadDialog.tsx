import { useEffect, useRef, useState, type DragEvent } from 'react'
import { isImageFile, isLabFile } from '../lib/assets'
import { filesFromDrop, isHtmlFile } from '../lib/importFiles'
import './UploadDialog.css'

interface Props {
  initialFiles?: File[]
  initialError?: string | null
  initialMode?: 'lab' | 'claat'
  onClose: () => void
  /** Returns an error message, or null when the lab opened. */
  onSubmit: (files: File[]) => Promise<string | null>
}

type Mode = 'lab' | 'claat'

const kind = (f: File) =>
  isLabFile(f) ? 'md' : isHtmlFile(f) ? 'html' : isImageFile(f) ? 'img' : /\.json$/i.test(f.name) ? 'json' : 'other'
const size = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`)
const BADGE: Record<string, string> = { md: 'MD', html: 'HTML', img: 'IMG', json: 'JSON', other: '?' }

export function UploadDialog({ initialFiles = [], initialError = null, initialMode = 'lab', onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<Mode>(() =>
    initialMode === 'claat' ||
    initialFiles.some((f) => /^index\.html?$/i.test(f.name) || f.name.toLowerCase() === 'codelab.json') ? 'claat' : 'lab',
  )
  const [files, setFiles] = useState<File[]>(initialFiles)
  const [error, setError] = useState<string | null>(initialError)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    dialog.current?.querySelector<HTMLElement>('.up-zone')?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && dialog.current) {
        const f = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]')]
        if (!f.length) return
        const i = f.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && i <= 0) (e.preventDefault(), f[f.length - 1].focus())
        else if (!e.shiftKey && i === f.length - 1) (e.preventDefault(), f[0].focus())
      }
    }
    document.addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', key)
      document.body.style.overflow = ''
      prev?.focus()
    }
  }, [onClose])

  const switchTo = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    setFiles([])
    setError(null)
  }

  const add = (list: FileList | File[] | null) => {
    const incoming = Array.from(list ?? [])
    if (!incoming.length) return
    setError(null)
    setFiles((cur) => {
      const names = new Set(incoming.map((f) => f.name))
      // a new .md or .html replaces the previous one
      const replacesLab = incoming.some((f) => isLabFile(f) || isHtmlFile(f))
      return [...cur.filter((f) => !names.has(f.name) && !(replacesLab && (isLabFile(f) || isHtmlFile(f)))), ...incoming]
    })
  }

  const drop = async (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    // A dropped folder (like an exported CLaaT folder) is opened up, img/ included.
    const dropped = await filesFromDrop(e.dataTransfer)
    if (dropped.some((f) => /^index\.html?$/i.test(f.name) || f.name.toLowerCase() === 'codelab.json')) setMode('claat')
    add(dropped)
  }

  const submit = async () => {
    setBusy(true)
    const err = await onSubmit(files)
    setBusy(false)
    if (err) setError(err)
  }

  const hasLab = files.some((f) => isLabFile(f) || isHtmlFile(f))
  const images = files.filter(isImageFile).length
  const claat = mode === 'claat'

  return (
    <div className="up-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="up-dialog" role="dialog" aria-modal="true" aria-labelledby="up-title" ref={dialog}>
        <div className="up-head">
          <h2 id="up-title">Open a lab</h2>
          <button className="up-x" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="up-tabs" role="tablist" aria-label="What are you opening?">
          <button role="tab" aria-selected={!claat} className={!claat ? 'on' : ''} onClick={() => switchTo('lab')}>
            <b>StepLab lab</b>
            <span>.md file + images, or a StepLab download</span>
          </button>
          <button role="tab" aria-selected={claat} className={claat ? 'on' : ''} onClick={() => switchTo('claat')}>
            <b>Old CLaaT codelab</b>
            <span>exported folder, converted for you</span>
          </button>
        </div>

        {error && (
          <div className="up-error" role="alert">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 7v6M12 16.5v.5" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        <div
          className={`up-zone${over ? ' over' : ''}`}
          tabIndex={0}
          role="button"
          aria-label={claat ? 'Choose the exported CLaaT folder, or drop it here' : 'Choose files, or drop them here'}
          onClick={() => (claat ? folderInput : input).current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), (claat ? folderInput : input).current?.click())}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
        >
          <svg className="up-icon" viewBox="0 0 48 48" aria-hidden="true">
            {claat ? (
              <path d="M6 14a4 4 0 0 1 4-4h9l4 5h15a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
            ) : (
              <>
                <path d="M14 34h-3a8 8 0 0 1-1-15.9A12 12 0 0 1 33.3 15 9 9 0 1 1 37 34h-3" />
                <path d="M24 40V22m-7 7 7-7 7 7" />
              </>
            )}
          </svg>
          {claat ? (
            <>
              <p className="up-big on-pointer">
                Drag the exported folder here, or <span>choose the folder</span>
              </p>
              <p className="up-big on-touch">Tap to choose the folder</p>
              <p className="up-small">
                The folder <code>claat export</code> made: <code>index.html</code>, <code>codelab.json</code> and <code>img/</code>.
                A CLaaT <code>.md</code> works too.
              </p>
            </>
          ) : (
            <>
              <p className="up-big on-pointer">
                Drag & drop files here, or <span>browse</span>
              </p>
              <p className="up-big on-touch">Tap to choose files</p>
              <p className="up-small">Your .md file and its images · or previously downloaded StepLab (.html)</p>
            </>
          )}
        </div>
        {claat && (
          <p className="up-alt">
            Picking files instead?{' '}
            <button className="up-link" onClick={() => input.current?.click()}>
              Choose index.html and the images
            </button>
          </p>
        )}

        {files.length > 0 && (
          <ul className="up-list" aria-label="Chosen files">
            {files.map((f) => {
              const k = kind(f)
              return (
                <li key={`${f.name}-${f.size}`} className={k === 'other' ? 'skip' : ''}>
                  <span className={`up-badge up-${k}`}>{BADGE[k]}</span>
                  <span className="up-name">{f.name}</span>
                  <span className="up-size">{k === 'other' ? 'not used' : size(f.size)}</span>
                  <button className="up-rm" onClick={() => setFiles((c) => c.filter((x) => x !== f))} aria-label={`Remove ${f.name}`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="up-foot">
          <p className="up-status">
            {!files.length
              ? claat
                ? 'Your files stay on your computer. StepLab converts them in the browser.'
                : 'Tip: select the .md and its images together.'
              : !hasLab
                ? claat
                  ? 'Add index.html from the exported folder.'
                  : 'Add the .md file too.'
                : `${images ? `${images} image${images > 1 ? 's' : ''} · ` : ''}${claat ? 'ready to convert' : 'ready to open'}`}
          </p>
          <div className="up-actions">
            <button className="btn btn-ghost-dark" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-red" onClick={submit} disabled={!files.length || busy}>
              {busy ? (claat ? 'Converting…' : 'Opening…') : claat ? 'Convert to StepLab' : 'Open lab'}
            </button>
          </div>
        </div>

        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept=".md,.markdown,.txt,.html,.htm,.json,text/markdown,text/plain,text/html,application/json,image/*"
          onChange={(e) => {
            add(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={folderInput}
          type="file"
          hidden
          // @ts-expect-error: folder picking is supported by all current browsers but missing from React's types
          webkitdirectory=""
          onChange={(e) => {
            const all = Array.from(e.target.files ?? [])
            add(all.filter((f) => isLabFile(f) || isHtmlFile(f) || isImageFile(f) || f.name.toLowerCase() === 'codelab.json'))
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
