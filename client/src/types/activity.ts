import type { CommunicationType } from '../constants/communication'

export interface ActivityDay {
  date: string
  leadsCreated: number
  communications: number
  followUpsCompleted: number
}

export interface ActivitySummary {
  range: { from: string; to: string }
  totals: {
    leadsCreated: number
    communications: number
    followUpsCompleted: number
    followUpsScheduled: number
    interested: number
    proposals: number
    won: number
    lost: number
  }
  communicationsByType: Record<CommunicationType, number>
  /** Null when the range is too long to break down by day. */
  daily: ActivityDay[] | null
}
