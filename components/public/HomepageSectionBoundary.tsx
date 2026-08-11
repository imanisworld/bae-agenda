'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportClientError } from '@/lib/client-error-reporting'

interface Props {
  children: ReactNode
  section: string
}

interface State {
  hasError: boolean
}

export default class HomepageSectionBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, {
      source: 'homepage-section',
      section: this.props.section,
      componentStack: info.componentStack,
    })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section
        aria-label="Temporarily unavailable homepage section"
        data-homepage-section-error={this.props.section}
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--off-black)',
          padding: '48px max(20px, 5vw)',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
          This section could not load. The rest of the page is still available.
        </p>
        <button type="button" className="btn-ghost" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </section>
    )
  }
}
