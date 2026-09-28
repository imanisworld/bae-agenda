import type { Metadata } from 'next'
import UtilityPageShell, { UtilitySection } from '@/components/public/UtilityPageShell'
import { DEFAULT_BOOKING_EMAIL } from '@/lib/content-schema'

export const metadata: Metadata = {
  title: 'Accessibility',
  alternates: {
    canonical: '/accessibility',
  },
  description: 'Accessibility information for The Bae Agenda website and client portal.',
}

export default function AccessibilityPage() {
  return (
    <UtilityPageShell
      eyebrow="Accessibility"
      title="Access for everyone."
      currentPath="/accessibility"
      intro={
        <p>
          The Bae Agenda is intended to be usable across phones, tablets, desktop browsers, keyboards, and assistive technology.
          Accessibility is treated as an ongoing part of the site rather than a one-time claim of compliance.
        </p>
      }
    >
      <UtilitySection title="What the site is designed to support">
        <p>
          The site uses semantic headings, labeled form fields, visible focus states, keyboard-accessible controls,
          readable contrast, responsive layouts, and reduced-motion support where animation is used.
        </p>
      </UtilitySection>

      <UtilitySection title="Booking and client portal access">
        <p>
          Booking forms, client portal sign-in, payment information, and booking-request forms are designed to work without
          requiring pointer-only interaction. Important status information is presented in text in addition to visual styling.
        </p>
      </UtilitySection>

      <UtilitySection title="Motion and media">
        <p>
          The site respects reduced-motion preferences for major transitions and decorative movement. Embedded media from third-party
          services may have accessibility behavior controlled by those providers.
        </p>
      </UtilitySection>

      <UtilitySection title="Need another format or assistance?">
        <p>
          If something on the site prevents you from reviewing booking information, submitting an inquiry, making a request,
          or completing another task, contact DJ B.A.E. and describe the page and what you were trying to do.
        </p>
        <p>
          Email{' '}
          <a href={`mailto:${DEFAULT_BOOKING_EMAIL}`} className="inline-link">
            {DEFAULT_BOOKING_EMAIL}
          </a>
          {' '}and the information or service can be provided another way when practical.
        </p>
      </UtilitySection>
    </UtilityPageShell>
  )
}
