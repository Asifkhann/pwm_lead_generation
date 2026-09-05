/**
 * Currencies a deal can be priced in. Values are stored on the lead, so keep
 * the codes stable. Add a currency by adding it here and to the country map.
 */

export const CURRENCIES = ['GBP', 'USD', 'EUR', 'PKR'] as const
export type Currency = (typeof CURRENCIES)[number]

export const DEFAULT_CURRENCY: Currency = 'GBP'

/**
 * Suggests a currency from the lead's country. Only a default — the form lets
 * the manager override it, because a business can be billed in any currency.
 */
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

export function currencyForCountry(country: string | undefined): Currency {
  if (!country) return DEFAULT_CURRENCY
  return COUNTRY_CURRENCY[country.trim().toLowerCase()] ?? DEFAULT_CURRENCY
}
