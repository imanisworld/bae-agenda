import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Privacy and cookie information for thebaeagenda.com.',
}

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--black)', paddingTop: '68px' }}>
      <div className="section-container" style={{ maxWidth: '840px', paddingTop: 0, display: 'grid', gap: '28px' }}>
        <section style={{ display: 'grid', gap: '16px' }}>
          <span className="section-label">Privacy</span>
          <h1
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(30px, 5vw, 56px)',
              lineHeight: 1.05,
              color: 'var(--white)',
              margin: 0,
            }}
          >
            Privacy &amp; Cookies
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
            This site keeps data collection light. The main purpose of any information collected here is to respond to booking requests,
            manage mix notifications, and understand basic site traffic.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'grid', gap: '18px' }}>
          <div>
            <h2 style={{ fontSize: '15px', color: 'var(--white)', marginBottom: '8px' }}>What gets collected</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
              Booking forms collect the details you submit, such as your name, email, event information, and any notes you provide.
              Mix notification signups collect your email address. Basic analytics may collect aggregated usage information such as page visits
              and device/browser patterns.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '15px', color: 'var(--white)', marginBottom: '8px' }}>How it is used</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
              Information is used to respond to inquiries, manage client communication, send requested updates, reduce spam, and improve site performance.
              It is not sold.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '15px', color: 'var(--white)', marginBottom: '8px' }}>Cookies and analytics</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
              thebaeagenda.com uses essential browser storage for site behavior and may use analytics tools from Vercel to understand traffic trends.
              Third-party embeds such as YouTube or SoundCloud may set their own cookies when loaded.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '15px', color: 'var(--white)', marginBottom: '8px' }}>Contact</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
              For privacy questions or requests related to your submitted information, email{' '}
              <a href="mailto:bookings@thebaeagenda.com" className="inline-link">bookings@thebaeagenda.com</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
