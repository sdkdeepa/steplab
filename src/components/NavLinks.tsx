import { useEffect, useRef, useState } from 'react'
import { ThemeMenuItem } from './ThemeToggle'

export interface NavActions {
  onHome: () => void
  onUpload: () => void
  onTemplate: () => void
  onAddImages?: () => void
}

const Icon = {
  home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  upload: <path d="M12 16V4m-5 5 5-5 5 5M5 20h14" />,
  template: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" />,
}

function Item({ icon, label, onClick }: { icon: keyof typeof Icon; label: string; onClick: () => void }) {
  return (
    <button className="nav-item" onClick={onClick}>
      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
        {Icon[icon]}
      </svg>
      <span>{label}</span>
    </button>
  )
}

/** Home · Upload .md · Start from a template. Inline on wide screens, a menu on narrow ones. */
export function NavLinks({ onHome, onUpload, onTemplate, variant }: NavActions & { variant: 'home' | 'lab' }) {
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
      <Item icon="home" label="Home" onClick={run(onHome)} />
      <Item icon="upload" label="Upload .md file" onClick={run(onUpload)} />
      <Item icon="template" label="Start from a template" onClick={run(onTemplate)} />
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
          <div className="menu-sep" role="separator" />
          <ThemeMenuItem onDone={() => setOpen(false)} />
        </nav>
      )}
    </div>
  )
}
