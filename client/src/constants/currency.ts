/** Mirrors server/src/constants/currency.ts — codes must stay in sync. */

export const CURRENCIES = ['GBP', 'USD', 'EUR', 'PKR'] as const
export type Currency = (typeof CURRENCIES)[number]

export const DEFAULT_CURRENCY: Currency = 'GBP'

export const CURRENCY_LABELS: Record<Currency, string> = {
  GBP: 'GBP — British pound',
  USD: 'USD — US dollar',
  EUR: 'EUR — Euro',
  PKR: 'PKR — Pakistani rupee',
}

const COUNTRY_CURRENCY: Record<string, Currency> = {
  'united kingdom': 'GBP',
  uk: 'GBP',
  'great britain': 'GBP',
  england: 'GBP',
  scotland: 'GBP',
  wales: 'GBP',
  'northern ireland': 'GBP',

  'united states': 'USD',
  'united states of america': 'USD',
  usa: 'USD',
  us: 'USD',

  ireland: 'EUR',
  germany: 'EUR',
  france: 'EUR',
  spain: 'EUR',
  italy: 'EUR',
  netherlands: 'EUR',
  belgium: 'EUR',
  portugal: 'EUR',
  austria: 'EUR',
  greece: 'EUR',
  finland: 'EUR',

  pakistan: 'PKR',
}

/** Suggests a currency from the country; the manager can always override it. */
export function currencyForCountry(country: string): Currency | null {
  return COUNTRY_CURRENCY[country.trim().toLowerCase()] ?? null
}
