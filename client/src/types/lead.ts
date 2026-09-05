import type { LeadPriority, LeadSource, LeadStatus } from '../constants/lead'
import type { Currency } from '../constants/currency'

export interface LeadSocialMedia {
  facebook: string
  instagram: string
  linkedin: string
  other: string
}

/** The manager a lead is assigned to, as returned by the API. */
export interface AssignedUser {
  id: string
  name: string
}

/** The newest note on a lead, included in the list response. */
export interface LatestNote {
  body: string
  createdAt: string
  authorName?: string
}

export interface Lead {
  id: string
  companyName: string
  businessType: string
  industry: string
  website: string
  socialMedia: LeadSocialMedia
  address: string
  city: string
  country: string
  ownerName: string
  contactPerson: string
  phone: string
  email: string
  servicesRequired: string[]
  problemsFound: string[]
  opportunities: string[]
  dealValue: number | null
  currency: Currency
  leadSource: LeadSource
  status: LeadStatus
  priority: LeadPriority
  assignedTo: AssignedUser | null
  lastContactedAt: string | null
  nextFollowUpAt: string | null
  /** Only present in list responses. */
  latestNote?: LatestNote | null
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface LeadListResponse {
  items: Lead[]
  pagination: Pagination
}

export const LEAD_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'companyName',
  'status',
  'priority',
  'lastContactedAt',
  'nextFollowUpAt',
  'dealValue',
] as const
export type LeadSortField = (typeof LEAD_SORT_FIELDS)[number]
export type SortOrder = 'asc' | 'desc'

export interface LeadListParams {
  page: number
  limit: number
  search: string
  status: string
  priority: string
  industry: string
  leadSource: string
  assignedTo: string
  sortBy: LeadSortField
  sortOrder: SortOrder
}

export interface LeadFilterOptions {
  industries: string[]
  /** Everyone who can be assigned a lead. */
  managers: AssignedUser[]
  unassignedCount: number
}

/** Values the add/edit form works with — strings everywhere the inputs are strings. */
export interface LeadFormValues {
  companyName: string
  businessType: string
  industry: string
  website: string
  address: string
  city: string
  country: string
  ownerName: string
  contactPerson: string
  phone: string
  email: string
  socialMedia: LeadSocialMedia
  problemsFound: string[]
  opportunities: string[]
  servicesRequired: string[]
  /** Empty string means "not known yet". */
  dealValue: string
  currency: Currency
  leadSource: LeadSource
  status: LeadStatus
  priority: LeadPriority
  /** A user id, or "" for unassigned. */
  assignedTo: string
  notes: string
}

export type LeadFormErrors = Partial<Record<string, string>>

/** Small updates made straight from the detail page's quick actions. */
export interface LeadPatch {
  status?: LeadStatus
  priority?: LeadPriority
  notes?: string
  nextFollowUpAt?: string | null
  lastContactedAt?: string | null
}

/** A lead that looks like the one being entered. */
export interface DuplicateLead {
  id: string
  companyName: string
  city: string
  phone: string
  email: string
  status: LeadStatus
  assignedTo: AssignedUser | null
  createdAt: string
}
