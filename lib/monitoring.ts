import { randomUUID } from 'crypto'

type LogLevel = 'info' | 'warn' | 'error'

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown error',
  }
}

export function createRequestId() {
  return randomUUID()
}

export function logEvent(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  if (level === 'error') {
    console.error(JSON.stringify(payload))
    return
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(payload))
    return
  }

  console.info(JSON.stringify(payload))
}

export function logError(message: string, error: unknown, meta: Record<string, unknown> = {}) {
  logEvent('error', message, {
    ...meta,
    error: serializeError(error),
  })
}
