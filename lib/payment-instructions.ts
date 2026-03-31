export function getBookingZelleHandle() {
  return process.env.BOOKING_ZELLE_HANDLE?.trim() || null
}

export function getBookingCashAppHandle() {
  return process.env.BOOKING_CASH_APP_HANDLE?.trim() || null
}

export function getPaymentInstructionRows(options?: { cardLabel?: string | null; cardUrl?: string | null }) {
  const rows: Array<readonly [string, string]> = []
  const zelle = getBookingZelleHandle()
  const cashApp = getBookingCashAppHandle()
  const cardUrl = options?.cardUrl?.trim() || null

  if (zelle) rows.push(['Zelle', zelle] as const)
  if (cashApp) rows.push(['Cash App', cashApp] as const)
  if (cardUrl) rows.push([options?.cardLabel?.trim() || 'Card', cardUrl] as const)

  return rows
}

export function getPaymentInstructionTextLines(options?: { cardLabel?: string | null; cardUrl?: string | null }) {
  return getPaymentInstructionRows(options).map(([label, value]) => `- ${label}: ${value}`)
}
