export type Currency = 'USD' | 'EUR'

const SYMBOLS: Record<Currency, string> = { USD: '$', EUR: '€' }

export function formatMoney(cents: number, currency: Currency = 'USD'): string {
  return `${SYMBOLS[currency]}${(cents / 100).toFixed(2)}`
}

export function parseMoney(text: string): number | null {
  const match = /^[$€](\d+)\.(\d{2})$/.exec(text)
  if (!match) return null
  return Number(match[1]) * 100 + Number(match[2])
}
