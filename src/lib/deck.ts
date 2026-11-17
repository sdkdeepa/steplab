/**
 * Makes every image slide deck (`.deck`) under `root` interactive: arrow buttons,
 * thumbnails, keyboard arrows, swipe and full screen.
 * Self-contained on purpose: it's also copied into the downloaded HTML file via toString().
 */
export function wireDecks(root: Document | HTMLElement): void {
  const doc = (root as Document).nodeType === 9 ? (root as Document) : (root as HTMLElement).ownerDocument
  const w = doc as Document & { __decks?: boolean }
  if (w.__decks) return
  w.__decks = true

  function show(deck: HTMLElement, to: number) {
    const imgs = Array.from(deck.querySelectorAll<HTMLImageElement>('.deck-stage > img'))
    const n = imgs.length
    if (!n) return
    const i = Math.max(0, Math.min(to, n - 1))
    deck.dataset.index = String(i)
    imgs.forEach((im, j) => (im.hidden = j !== i))
    deck.querySelectorAll<HTMLElement>('.deck-thumb').forEach((t, j) => {
      t.classList.toggle('on', j === i)
      if (j === i) t.scrollIntoView({ block: 'nearest', inline: 'center' })
    })
    const count = deck.querySelector('.deck-count')
    if (count) count.textContent = `${i + 1} / ${n}`
    const cap = deck.querySelector('.deck-cap')
    if (cap) cap.textContent = imgs[i].dataset.caption || ''
    const prev = deck.querySelector<HTMLButtonElement>('.deck-prev')
    const next = deck.querySelector<HTMLButtonElement>('.deck-next')
    if (prev) prev.disabled = i === 0
    if (next) next.disabled = i === n - 1
  }
  const idx = (deck: HTMLElement) => Number(deck.dataset.index || 0)

  doc.addEventListener('click', (e) => {
    const el = e.target as HTMLElement
    const deck = el.closest<HTMLElement>('[data-deck]')
    if (!deck) return
    if (el.closest('.deck-prev')) show(deck, idx(deck) - 1)
    else if (el.closest('.deck-next')) show(deck, idx(deck) + 1)
    else if (el.closest('.deck-thumb')) show(deck, Number(el.closest<HTMLElement>('.deck-thumb')!.dataset.go))
    else if (el.closest('.deck-full')) {
      const d = deck as HTMLElement & { webkitRequestFullscreen?: () => void }
      if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {})
      else if (d.requestFullscreen) d.requestFullscreen().catch(() => deck.classList.toggle('deck-max'))
      else if (d.webkitRequestFullscreen) d.webkitRequestFullscreen()
      else deck.classList.toggle('deck-max')
    }
  })

  doc.addEventListener(
    'keydown',
    (e) => {
      const deck = (e.target as HTMLElement).closest?.('[data-deck]') as HTMLElement | null
      if (!deck) return
      if (e.key === 'ArrowRight') show(deck, idx(deck) + 1)
      else if (e.key === 'ArrowLeft') show(deck, idx(deck) - 1)
      else if (e.key === 'Escape') deck.classList.remove('deck-max')
      else return
      e.preventDefault()
      e.stopPropagation()
    },
    true,
  )

  let start: { x: number; y: number; deck: HTMLElement } | null = null
  doc.addEventListener(
    'touchstart',
    (e) => {
      const deck = (e.target as HTMLElement).closest?.('.deck-stage')?.closest('[data-deck]') as HTMLElement | null
      start = deck ? { x: e.touches[0].clientX, y: e.touches[0].clientY, deck } : null
    },
    { passive: true },
  )
  doc.addEventListener(
    'touchend',
    (e) => {
      if (!start) return
      const dx = e.changedTouches[0].clientX - start.x
      const dy = e.changedTouches[0].clientY - start.y
      const deck = start.deck
      start = null
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return
      show(deck, idx(deck) + (dx < 0 ? 1 : -1))
    },
    { passive: true },
  )
}
