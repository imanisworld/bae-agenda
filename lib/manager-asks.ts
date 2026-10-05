// Turns an opportunity's saved "requirements" text into a checklist of the
// things the lead actually asked for. Outreach can't be sent or recorded until
// each item is confirmed as covered.

const MAX_ASKS = 12

export function splitManagerAsks(requirements: string | null | undefined): string[] {
  const text = (requirements ?? '').trim()
  if (!text) return []

  const asks = text
    .split(/\r?\n|;|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((part) =>
      part
        .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
        .replace(/[.;,\s]+$/, '')
        .trim()
    )
    .filter((part) => part.length > 1)

  return asks.slice(0, MAX_ASKS)
}

export function managerAsksConfirmed(asks: string[], confirmed: string[]) {
  if (asks.length === 0) return false
  const checked = new Set(confirmed)
  return asks.every((_, index) => checked.has(String(index)))
}
