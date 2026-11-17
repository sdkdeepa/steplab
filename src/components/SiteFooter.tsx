import { CREATOR, hasCreatorLink } from '../config'
import { Logo } from './Logo'

export function CreatedBy() {
  return (
    <span className="created-by">
      Created by{' '}
      {hasCreatorLink ? (
        <a href={CREATOR.linkedin} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4z" />
          </svg>
          {CREATOR.name}
        </a>
      ) : (
        <strong>{CREATOR.name}</strong>
      )}
    </span>
  )
}

/** Full footer for the home page. */
export function SiteFooter() {
  return (
    <footer className="home-foot">
      <span>
        <Logo size={20} /> StepLab · open source, MIT licensed
      </span>
      <CreatedBy />
    </footer>
  )
}
