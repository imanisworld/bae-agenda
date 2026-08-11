export type ClientErrorSource = 'homepage-section' | 'public-route' | 'global'

interface ClientErrorContext {
  source: ClientErrorSource
  section?: string
  componentStack?: string | null
  digest?: string
}

const reportedErrors = new Set<string>()

function errorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : 'Unknown client error',
  }
}

export function reportClientError(error: unknown, context: ClientErrorContext) {
  const details = errorDetails(error)
  const signature = [context.source, context.section, details.name, details.message].join(':')

  console.error('[client-error]', {
    ...context,
    ...details,
    environment: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ?? 'local',
  })

  if (typeof window === 'undefined' || reportedErrors.has(signature)) return
  reportedErrors.add(signature)

  const environment = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ?? 'local'
  if (environment === 'local') return

  const body = JSON.stringify({
    ...context,
    ...details,
    environment,
    pathname: window.location.pathname,
  })

  void fetch('/api/client-errors', {
    method: 'POST',
    credentials: 'same-origin',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body,
  }).catch(() => {
    // Reporting must never turn a recoverable rendering failure into another crash.
  })
}
