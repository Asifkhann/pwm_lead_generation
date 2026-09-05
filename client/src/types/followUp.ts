import type { LeadPriority, LeadStatus } from '../constants/lead'
import type { AssignedUser } from './lead'

export const FOLLOW_UP_STATUSES = ['pending', 'completed', 'cancelled'] as const
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number]

/** The subset of the lead returned alongside a follow-up. */
export interface FollowUpLead {
  id: string
  companyName: string
  phone: string
  email: string
  contactPerson: string
  ownerName: string
  city: string
  status: LeadStatus
  priority: LeadPriority
  assignedTo: AssignedUser | null
}

export interface FollowUp {
  id: string
  lead: FollowUpLead
  dueDate: string
  note: string
  status: FollowUpStatus
  completedAt: string | null
  communication: string | null
  createdAt: string
  updatedAt: string
}

/** A follow-up read from a lead's own list, where the lead is not populated. */
export interface LeadFollowUp extends Omit<FollowUp, 'lead'> {
  lead: string
}

export interface FollowUpBuckets {
  overdue: FollowUp[]
  today: FollowUp[]
  upcoming: FollowUp[]
  counts: { overdue: number; today: number; upcoming: number }
}

export interface FollowUpPayload {
  dueDate: string
  note: string
}
