/** Named date ranges for the activity view, all computed in local time. */

export const RANGE_PRESETS = [
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_7_days',
  'last_30_days',
  'last_90_days',
  'this_year',
  'custom',
] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This week',
  last_week: 'Last week',
  this_month: 'This month',
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
  last_90_days: 'Last 90 days',
  this_year: 'This year',
  custom: 'Custom',
}

export interface DateRange {
  /** Inclusive start of the first day. */
  from: Date
  /** Exclusive end, so the last day is fully covered. */
  to: Date
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Weeks run Monday to Sunday. */
function startOfWeek(date: Date): Date {
  const start = startOfDay(date)
  const weekday = (start.getDay() + 6) % 7
  return addDays(start, -weekday)
}

export function resolvePreset(preset: Exclude<RangePreset, 'custom'>, now = new Date()): DateRange {
  const today = startOfDay(now)

  switch (preset) {
    case 'today':
      return { from: today, to: addDays(today, 1) }
    case 'yesterday':
      return { from: addDays(today, -1), to: today }
    case 'this_week':
      return { from: startOfWeek(today), to: addDays(startOfWeek(today), 7) }
    case 'last_week':
      return { from: addDays(startOfWeek(today), -7), to: startOfWeek(today) }
    case 'this_month':
      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      }
    // "Last N days" includes today, so the window ends tomorrow.
    case 'last_7_days':
      return { from: addDays(today, -6), to: addDays(today, 1) }
    case 'last_30_days':
      return { from: addDays(today, -29), to: addDays(today, 1) }
    case 'last_90_days':
      return { from: addDays(today, -89), to: addDays(today, 1) }
    case 'this_year':
      return {
        from: new Date(today.getFullYear(), 0, 1),
        to: new Date(today.getFullYear() + 1, 0, 1),
      }
  }
}

/** Builds a range from two <input type="date"> values, end inclusive. */
export function rangeFromInputs(fromValue: string, toValue: string): DateRange | null {
  if (!fromValue || !toValue) return null

  const [fy, fm, fd] = fromValue.split('-').map(Number)
  const [ty, tm, td] = toValue.split('-').map(Number)
  const from = new Date(fy, fm - 1, fd)
  const to = addDays(new Date(ty, tm - 1, td), 1)

  return to <= from ? null : { from, to }
}

/** "5 Sep 2026" or "1 – 5 Sep 2026" for the range caption. */
export function describeRange({ from, to }: DateRange): string {
  const lastDay = addDays(to, -1)
  const format = (date: Date, withYear = true) =>
    date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
    })

  if (startOfDay(from).getTime() === startOfDay(lastDay).getTime()) return format(from)
  return `${format(from, from.getFullYear() !== lastDay.getFullYear())} – ${format(lastDay)}`
}
