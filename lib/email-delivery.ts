export type EmailDeliveryMode = 'live' | 'redirect' | 'disabled'

interface EmailDeliveryInput {
  to: string
  subject: string
  replyTo?: string
}

type EmailDeliveryDecision =
  | { enabled: false; environment: string; mode: 'disabled' }
  | {
      enabled: true
      environment: string
      mode: 'live' | 'redirect'
      to: string
      subject: string
      replyTo?: string
    }

function deploymentEnvironment() {
  if (process.env.VERCEL_TARGET_ENV) return process.env.VERCEL_TARGET_ENV
  if (process.env.VERCEL_ENV === 'production') return 'production'
  if (process.env.VERCEL_ENV === 'preview') return 'preview'
  if (process.env.NEXT_PUBLIC_DEPLOYMENT_ENV) {
    return process.env.NEXT_PUBLIC_DEPLOYMENT_ENV
  }
  return 'local'
}

function configuredMode(environment: string): EmailDeliveryMode {
  const value = process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase()
  if (value === 'disabled' || value === 'redirect') return value

  // Production preserves the existing live behavior. Every other environment
  // fails closed unless it has an explicit redirect inbox.
  return environment === 'production' ? 'live' : 'disabled'
}

export function resolveEmailDelivery(input: EmailDeliveryInput): EmailDeliveryDecision {
  const environment = deploymentEnvironment()
  const mode = configuredMode(environment)

  if (mode === 'disabled') {
    return { enabled: false, environment, mode }
  }

  if (mode === 'redirect') {
    const redirectTo = process.env.EMAIL_REDIRECT_TO?.trim()
    if (!redirectTo) {
      return { enabled: false, environment, mode: 'disabled' }
    }

    return {
      enabled: true,
      environment,
      mode,
      to: redirectTo,
      subject: `[${environment.toUpperCase()} for ${input.to}] ${input.subject}`,
      // Never let a tester accidentally reply to a real client from redirected mail.
      replyTo: undefined,
    }
  }

  return {
    enabled: true,
    environment,
    mode,
    to: input.to,
    subject: input.subject,
    replyTo: input.replyTo,
  }
}
