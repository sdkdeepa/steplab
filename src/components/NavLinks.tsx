import { useEffect, useRef, useState } from 'react'

export interface NavActions {
  onHome: () => void
  onUpload: () => void
  onTemplate: () => void
  onFormat: () => void
  onAddImages?: () => void
}

function Item({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="nav-item" onClick={onClick}>
      <span>{label}</span>
    </button>
  )
}

/** Home · Upload .md · Start from a template · Format. Inline on wide screens, a menu on narrow ones. */
export function NavLinks({ onHome, onUpload, onTemplate, onFormat, variant }: NavActions & { variant: 'home' | 'lab' }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      if (e instanceof MouseEvent && wrap.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const run = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  const items = (
    <>
      <Item label="Home" onClick={run(onHome)} />
      <Item label="Upload markdown" onClick={run(onUpload)} />
      <Item label="Start from a template" onClick={run(onTemplate)} />
      <Item label="Format" onClick={run(onFormat)} />
    </>
  )

  return (
    <div className={`navlinks navlinks-${variant}`} ref={wrap}>
      <nav className="navlinks-inline" aria-label="Main">
        {items}
      </nav>
      <button
        className="navlinks-toggle"
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <nav className="navlinks-menu" aria-label="Main">
          {items}
        </nav>
      )}
    </div>
  )
}
