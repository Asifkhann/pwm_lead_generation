import type { LeadStatus } from '../constants/lead'

export interface TrendPoint {
  date: string
  leads: number
  communications: number
}

export interface CurrencyTotal {
  currency: string
  total: number
  count: number
}

export interface DashboardSummary {
  totals: Record<LeadStatus, number> & { total: number }
  followUps: { overdue: number; dueToday: number; upcoming: number }
  today: { leadsAdded: number; communications: number; followUpsCompleted: number }
  month: { won: number; lost: number; leadsAdded: number }
  conversionRate: number | null
  /** Money totals, kept apart per currency. */
  value: { wonThisMonth: CurrencyTotal[]; openPipeline: CurrencyTotal[] }
  trend: TrendPoint[]
}
