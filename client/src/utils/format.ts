/** Formats an ISO date as "4 Sep 2026", or a dash when absent. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Stored websites may omit the protocol, so add one for the href. */
export function toExternalUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

/** Shortens a URL to just its host, e.g. "https://www.acme.pk/x" -> "acme.pk". */
export function toDisplayUrl(value: string): string {
  try {
    const { hostname, pathname } = new URL(toExternalUrl(value))
    const host = hostname.replace(/^www\./i, '')
    return pathname && pathname !== '/' ? `${host}${pathname}` : host
  } catch {
    return value.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  }
}

/** ISO date -> "2026-09-10" for <input type="date">. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

/** Today's date in the same format, used to flag overdue follow-ups. */
export function todayInputValue(): string {
  return toDateInputValue(new Date().toISOString())
}

/** Whole days from today; negative means the date has passed. */
export function daysFromToday(value: string | null | undefined): number | null {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = startOfDay(target).getTime() - startOfDay(new Date()).getTime()
  return Math.round(diff / 86_400_000)
}

/** "Today", "Tomorrow", "3 days overdue", … for follow-up dates. */
export function describeRelativeDay(value: string | null | undefined): string | null {
  const days = daysFromToday(value)
  if (days === null) return null
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return '1 day overdue'
  if (days < 0) return `${Math.abs(days)} days overdue`
  return `in ${days} days`
}

/**
 * "2026-09-20" -> ISO string for local midnight. Parsing the plain string
 * would give UTC midnight, which reads as the previous day west of UTC.
 */
export function fromDateInputValue(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toISOString()
}

/** ISO -> "14:30" for <input type="time">, in local time. */
export function toTimeInputValue(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** Combines the date and time inputs into an ISO instant, read as local time. */
export function fromDateTimeInputs(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = (time || '00:00').split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes).toISOString()
}

/** "4 Sep 2026, 14:30" for timeline entries. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "£1,500" / "₨150,000". Whole units — deal values are not priced in pence. */
export function formatMoney(
  amount: number | null | undefined,
  currency: string,
  options: { compact?: boolean } = {},
): string {
  if (amount === null || amount === undefined) return '—'

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    ...(options.compact && Math.abs(amount) >= 10_000
      ? { notation: 'compact', maximumFractionDigits: 1 }
      : {}),
  }).format(amount)
}
