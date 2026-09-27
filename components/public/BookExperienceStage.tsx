'use client'

import { useState } from 'react'

export default function BookExperienceStage({
  form,
  rail,
}: {
  form: React.ReactNode
  rail: React.ReactNode
}) {
  const [panel, setPanel] = useState<'inquiry' | 'contact'>('inquiry')

  return (
    <div className={`book-experience book-experience--${panel}`}>
      <div className="book-experience-switch" role="tablist" aria-label="Book and contact">
        <button
          type="button"
          role="tab"
          aria-selected={panel === 'inquiry'}
          onClick={() => setPanel('inquiry')}
        >
          Inquiry
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={panel === 'contact'}
          onClick={() => setPanel('contact')}
        >
          Contact + FAQ
        </button>
      </div>

      <section className="book-experience-form" aria-label="Booking inquiry">
        {form}
      </section>
      <aside className="book-experience-rail" aria-label="Contact and booking information">
        {rail}
      </aside>
    </div>
  )
}
