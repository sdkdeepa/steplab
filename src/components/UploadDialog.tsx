import { useEffect, useRef, useState, type DragEvent } from 'react'
import { isImageFile, isLabFile } from '../lib/assets'
import { isHtmlFile } from '../lib/importFiles'

interface Props {
  initialFiles?: File[]
  initialError?: string | null
  onClose: () => void
  /** Returns an error message, or null when the lab opened. */
  onSubmit: (files: File[]) => Promise<string | null>
}

const kind = (f: File) => (isLabFile(f) ? 'md' : isHtmlFile(f) ? 'html' : isImageFile(f) ? 'img' : 'other')
const size = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`)

export function UploadDialog({ initialFiles = [], initialError = null, onClose, onSubmit }: Props) {
  const [files, setFiles] = useState<File[]>(initialFiles)
  const [error, setError] = useState<string | null>(initialError)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
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

  const drop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    add(e.dataTransfer.files)
  }

  const submit = async () => {
    setBusy(true)
    const err = await onSubmit(files)
    setBusy(false)
    if (err) setError(err)
  }

  const hasLab = files.some((f) => isLabFile(f) || isHtmlFile(f))
  const images = files.filter(isImageFile).length

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
          aria-label="Choose files, or drop them here"
          onClick={() => input.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click())}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
        >
          <svg className="up-icon" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M14 34h-3a8 8 0 0 1-1-15.9A12 12 0 0 1 33.3 15 9 9 0 1 1 37 34h-3" />
            <path d="M24 40V22m-7 7 7-7 7 7" />
          </svg>
          <p className="up-big on-pointer">
            Drag & drop files here, or <span>browse</span>
          </p>
          <p className="up-big on-touch">
            Tap to choose files
          </p>
          <p className="up-small">Your .md file and its images · or a lab you downloaded from StepLab (.html)</p>
        </div>

        {files.length > 0 && (
          <ul className="up-list" aria-label="Chosen files">
            {files.map((f) => {
              const k = kind(f)
              return (
                <li key={f.name} className={k === 'other' ? 'skip' : ''}>
                  <span className={`up-badge up-${k}`}>{k === 'md' ? 'MD' : k === 'html' ? 'HTML' : k === 'img' ? 'IMG' : '?'}</span>
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
              ? 'Tip: select the .md and its images together.'
              : !hasLab
                ? 'Add the .md file too.'
                : `${images ? `${images} image${images > 1 ? 's' : ''} · ` : ''}ready to open`}
          </p>
          <div className="up-actions">
            <button className="btn btn-ghost-dark" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-red" onClick={submit} disabled={!files.length || busy}>
              {busy ? 'Opening…' : 'Open lab'}
            </button>
          </div>
        </div>

        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept=".md,.markdown,.txt,.html,.htm,text/markdown,text/plain,text/html,image/*"
          onChange={(e) => {
            add(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
