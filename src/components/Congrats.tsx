import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { Lab } from '../lib/parser'

interface Props {
  lab: Lab
  onClose: () => void
  onRestart: () => void
}

export function Congrats({ lab, onClose, onRestart }: Props) {
  const closeBtn = useRef<HTMLButtonElement>(null)
  const restartBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const colors = ['#e8251a', '#0b0d0f', '#d5dbe0', '#ffb000', '#ffffff']
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors, zIndex: 60 })
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, zIndex: 60 }), 250)
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, zIndex: 60 }), 400)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        e.preventDefault()
        const next = document.activeElement === closeBtn.current ? restartBtn.current : closeBtn.current
        next?.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('keydown', key)
      prev?.focus()
    }
  }, [onClose])

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="congrats" role="dialog" aria-modal="true" aria-labelledby="congrats-title">
        <div className="badge" aria-hidden="true">
          <svg viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="46" fill="#e8251a" />
            <circle cx="48" cy="48" r="37" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="3 6" opacity=".8" />
            <path d="M31 49l12 12 23-26" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 id="congrats-title">Congratulations!</h2>
        <p>
          You've finished <strong>{lab.title}</strong>.
        </p>
        <div className="congrats-stats">
          <div>
            <b>{lab.steps.length}</b>
            <span>steps done</span>
          </div>
          {lab.totalMinutes > 0 && (
            <div>
              <b>{lab.totalMinutes}</b>
              <span>minutes of hands-on work</span>
            </div>
          )}
        </div>
        <div className="congrats-actions">
          <button ref={restartBtn} className="btn btn-ghost-dark" onClick={onRestart}>
            Start over
          </button>
          <button ref={closeBtn} className="btn btn-ink" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
