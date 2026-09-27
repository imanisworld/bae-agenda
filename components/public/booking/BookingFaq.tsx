/**
 * BOOKING FAQ
 * The questions clients actually ask before booking, answered on the page
 * that does the conversion work. Native <details> accordion — no JS needed.
 * Rendered below the booking form on /book.
 */

export const BOOKING_FAQ = [
  {
    question: 'How far in advance should I book?',
    answer:
      'As early as you can — weekend and holiday dates go first. That said, the form checks the calendar in real time, so if your date is close, send it anyway and you will get a straight answer on availability.',
  },
  {
    question: 'What happens after I send the inquiry?',
    answer:
      'You get a personal reply with availability and a custom quote for your event. Submitting the form does not charge you or reserve the date; it starts the conversation.',
  },
  {
    question: 'How does payment work?',
    answer:
      'Once details are confirmed, a deposit secures your date and the remaining balance is due before the event. Invoices arrive by email, and you can track everything — deposit, balance, receipts — in the client portal.',
  },
  {
    question: 'What kinds of events do you play?',
    answer:
      'Weddings, private parties, corporate events, club nights, brand activations, and festivals — from intimate gatherings to large-scale productions.',
  },
  {
    question: 'Do you travel?',
    answer:
      'Based in Indianapolis with roots in Chicago, and available for travel. Put your city in the request and travel gets factored into the quote.',
  },
  {
    question: 'Can you play my must-have songs?',
    answer:
      'Yes — the whole point is a set built for your room. Open format across house, hip hop, R&B, Latin, soca, jungle, juke, ballroom, and more, with room for your must-plays and do-not-plays.',
  },
] as const

export default function BookingFaq() {
  return (
    <section aria-label="Booking questions" style={{ background: 'var(--off-black)' }}>
      <div className="section-container" style={{ maxWidth: '680px', paddingTop: 0, paddingBottom: '96px' }}>
        <div style={{ marginBottom: '28px' }}>
          <span className="section-label">Booking FAQ</span>
          <h2
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(22px, 3.5vw, 32px)',
              fontWeight: 600,
              color: 'var(--white)',
              lineHeight: 1.15,
              margin: '12px 0 0',
            }}
          >
            Common Questions
          </h2>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {BOOKING_FAQ.map((item) => (
            <details key={item.question} className="booking-faq-item">
              <summary className="booking-faq-question">{item.question}</summary>
              <p className="booking-faq-answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
