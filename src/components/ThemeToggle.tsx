import { useEffect, useState } from 'react'
import { applyTheme, currentTheme, watchSystemTheme, type Theme } from '../lib/theme'

/** Shared state so every toggle on the page agrees. */
let listeners: ((t: Theme) => void)[] = []
function setTheme(t: Theme) {
  applyTheme(t, true)
  listeners.forEach((l) => l(t))
}

export function useTheme(): [Theme, () => void] {
  const [theme, set] = useState<Theme>(currentTheme)
  useEffect(() => {
    listeners.push(set)
    const stop = watchSystemTheme(set)
    return () => {
      listeners = listeners.filter((l) => l !== set)
      stop()
    }
  }, [])
  return [theme, () => setTheme(theme === 'dark' ? 'light' : 'dark')]
}

const Sun = (
  <g>
    <circle className="sun-core" cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
  </g>
)
const Moon = <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />

/** Round sun/moon button. Shows the moon in light mode (tap for dark) and the sun in dark mode. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, toggle] = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className={`theme-toggle${theme === 'dark' ? ' is-dark' : ''} ${className}`}
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" key={theme}>
        {theme === 'dark' ? Sun : Moon}
      </svg>
    </button>
  )
}

/** Same control as a labelled menu row (used in the phone menu). */
export function ThemeMenuItem({ onDone }: { onDone?: () => void }) {
  const [theme, toggle] = useTheme()
  return (
    <button
      type="button"
      className="nav-item"
      onClick={() => {
        toggle()
        onDone?.()
      }}
    >
      <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
    </button>
  )
}
