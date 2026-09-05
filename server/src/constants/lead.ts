/** Shared lead enums. Values are stored in MongoDB, so keep them stable. */

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'interested',
  'follow_up',
  'proposal',
  'won',
  'lost',
] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_PRIORITIES = ['low', 'medium', 'high'] as const
export type LeadPriority = (typeof LEAD_PRIORITIES)[number]

export const LEAD_SOURCES = [
  'google_maps',
  'google_search',
  'facebook',
  'instagram',
  'linkedin',
  'referral',
  'cold_call',
  'walk_in',
  'website',
  'other',
] as const
export type LeadSource = (typeof LEAD_SOURCES)[number]
