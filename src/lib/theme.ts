export type Theme = 'light' | 'dark'
const KEY = 'steplab:theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

/** The user's saved choice, or the device setting. */
export const currentTheme = (): Theme => storedTheme() ?? (media().matches ? 'dark' : 'light')

export function applyTheme(theme: Theme, save: boolean) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  if (save)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* storage unavailable */
    }
}

/** Follows the device setting until the user picks a theme. */
export function watchSystemTheme(onChange: (t: Theme) => void) {
  const m = media()
  const handler = () => {
    if (!storedTheme()) {
      const t: Theme = m.matches ? 'dark' : 'light'
      applyTheme(t, false)
      onChange(t)
    }
  }
  m.addEventListener('change', handler)
  return () => m.removeEventListener('change', handler)
}
