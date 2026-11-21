import { CREATOR, hasCreatorLink } from '../config'
import { Logo } from './Logo'

export function CreatedBy() {
  return (
    <span className="created-by">
      Created by{' '}
      {hasCreatorLink ? (
        <a href={CREATOR.linkedin} target="_blank" rel="noopener noreferrer" title={`${CREATOR.name} on LinkedIn`}>
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
