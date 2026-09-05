import type { LeadStatus } from '../constants/lead'

export interface ReportCountRow {
  /** Stable identity: the stored value, or "__other__" for the folded tail. */
  key: string
  label: string
  value: number
}

export interface ManagerRow {
  manager: string
  leadsCreated: number
  won: number
  lost: number
  communications: number
  followUpsCompleted: number
  conversionRate: number | null
}

export interface CurrencyTotal {
  currency: string
  total: number
  count: number
}

export interface ReportSummary {
  range: { from: string; to: string }
  totalLeads: number
  leadsOverTime: {
    granularity: 'day' | 'month'
    points: { date: string; value: number }[]
  }
  byIndustry: ReportCountRow[]
  bySource: ReportCountRow[]
  byStatus: Record<LeadStatus, number>
  outcomes: { won: number; lost: number; decided: number; conversionRate: number | null }
  followUps: {
    completed: number
    pending: number
    overdue: number
    cancelled: number
    total: number
    rate: number | null
  }
  managers: ManagerRow[]
  value: { won: CurrencyTotal[]; lost: CurrencyTotal[]; open: CurrencyTotal[] }
}
