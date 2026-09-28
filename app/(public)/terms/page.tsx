import type { Metadata } from 'next'
import UtilityPageShell, { UtilitySection } from '@/components/public/UtilityPageShell'
import { DEFAULT_BOOKING_EMAIL } from '@/lib/content-schema'

export const metadata: Metadata = {
  title: 'Booking & Site Terms',
  alternates: {
    canonical: '/terms',
  },
  description: 'Booking, payment, and site terms for DJ B.A.E. and The Bae Agenda.',
}

export default function TermsPage() {
  return (
    <UtilityPageShell
      eyebrow="Terms"
      title="Booking & Site Terms"
      currentPath="/terms"
      intro={
        <p>
          These terms explain the general booking, payment, client-portal, and website rules used by The Bae Agenda.
          A specific written quote, invoice, or agreed booking term controls if it says something different.
        </p>
      }
    >
      <UtilitySection title="Inquiries and booking confirmation">
        <p>
          Submitting an inquiry does not reserve a date. A booking becomes confirmed only after the event details,
          pricing, and booking status have been accepted and any required deposit has been received.
        </p>
      </UtilitySection>

      <UtilitySection title="Quotes, invoices, and payment">
        <p>
          Quotes and invoices may include service line items, deposits or credits, payment terms, and a due date.
          Unless the written invoice says otherwise, the deposit is non-refundable, the remaining balance is due on or before
          the event date, and the final balance must be paid before the event.
        </p>
        <p>
          Payment records shown in the client portal reflect payments recorded by The Bae Agenda and may take time to update
          after a transfer or other offline payment.
        </p>
      </UtilitySection>

      <UtilitySection title="Changes and cancellations">
        <p>
          Clients can request booking changes or discuss a cancellation through the client portal or by contacting DJ B.A.E.
          A request does not automatically modify or cancel the booking. Changes are effective only after they are reviewed and confirmed.
        </p>
        <p>
          Any refund, rescheduling credit, or other exception is handled according to the specific booking circumstances and any
          written terms already provided for that booking.
        </p>
      </UtilitySection>

      <UtilitySection title="Event details and client responsibilities">
        <p>
          Clients are responsible for providing accurate event timing, venue, access, setup, contact, and logistical information.
          Material changes to timing, location, scope, or requested services may require an updated quote or invoice.
        </p>
      </UtilitySection>

      <UtilitySection title="Client portal">
        <p>
          Portal access is intended only for the client associated with the booking. Verification codes and portal links should not
          be shared with someone who is not authorized to view the booking.
        </p>
      </UtilitySection>

      <UtilitySection title="Website content">
        <p>
          Site content, branding, photography, graphics, mixes, and other original materials remain the property of their respective
          owners and may not be copied or republished without permission except where ordinary sharing features allow it.
        </p>
      </UtilitySection>

      <UtilitySection title="Site availability">
        <p>
          The website and client portal may occasionally be unavailable for maintenance, provider outages, or other technical reasons.
          If an online feature is unavailable, booking questions and requests can still be handled by direct contact.
        </p>
      </UtilitySection>

      <UtilitySection title="Contact">
        <p>
          Questions about a booking, invoice, or these terms can be sent to{' '}
          <a href={`mailto:${DEFAULT_BOOKING_EMAIL}`} className="inline-link">
            {DEFAULT_BOOKING_EMAIL}
          </a>.
        </p>
      </UtilitySection>
    </UtilityPageShell>
  )
}
