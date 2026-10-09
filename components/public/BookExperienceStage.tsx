'use client'

import { useEffect, useState } from 'react'

export default function BookExperienceStage({
  form,
  rail,
}: {
  form: React.ReactNode
  rail: React.ReactNode
}) {
  const [panel, setPanel] = useState<'inquiry' | 'contact'>('inquiry')

  // #contact deliberately matches no element id: the browser's own jump to a
  // hash target scrolled the Inquiry/Contact switch off screen on phones.
  useEffect(() => {
    const syncHash = () => {
      setPanel(window.location.hash === '#contact' ? 'contact' : 'inquiry')
    }
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  function choosePanel(next: 'inquiry' | 'contact', moveFocus = false) {
    setPanel(next)
    const url = next === 'contact'
      ? `${window.location.pathname}${window.location.search}#contact`
      : `${window.location.pathname}${window.location.search}`
    window.history.replaceState(null, '', url)
    if (moveFocus) {
      window.requestAnimationFrame(() => {
        document.getElementById(`book-tab-${next}`)?.focus()
      })
    }
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    choosePanel(panel === 'inquiry' ? 'contact' : 'inquiry', true)
  }

  return (
    <div className={`book-experience book-experience--${panel}`}>
      <div
        className="book-experience-switch"
        role="tablist"
        aria-label="Book and contact"
        onKeyDown={onTabKeyDown}
      >
        <button
          type="button"
          role="tab"
          id="book-tab-inquiry"
          aria-controls="book-panel-inquiry"
          aria-selected={panel === 'inquiry'}
          tabIndex={panel === 'inquiry' ? 0 : -1}
          onClick={() => choosePanel('inquiry')}
        >
          Inquiry
        </button>
        <button
          type="button"
          role="tab"
          id="book-tab-contact"
          aria-controls="book-panel-contact"
          aria-selected={panel === 'contact'}
          tabIndex={panel === 'contact' ? 0 : -1}
          onClick={() => choosePanel('contact')}
        >
          Contact + FAQ
        </button>
      </div>

      <section
        id="book-panel-inquiry"
        className="book-experience-form"
        role="tabpanel"
        aria-labelledby="book-tab-inquiry"
        aria-label="Booking inquiry"
      >
        {form}
      </section>
      <aside
        id="book-panel-contact"
        className="book-experience-rail"
        role="tabpanel"
        aria-labelledby="book-tab-contact"
        aria-label="Contact and booking information"
      >
        {rail}
      </aside>
    </div>
  )
}
