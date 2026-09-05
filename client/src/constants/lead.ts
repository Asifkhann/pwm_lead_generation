/** Mirrors server/src/constants/lead.ts — values must stay in sync. */

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

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  follow_up: 'Follow-up',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
}

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  google_maps: 'Google Maps',
  google_search: 'Google Search',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  referral: 'Referral',
  cold_call: 'Cold Call',
  walk_in: 'Walk-in',
  website: 'Website',
  other: 'Other',
}

export const LEAD_STATUS_CLASSES: Record<LeadStatus, string> = {
  new: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  contacted: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  interested: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  follow_up: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  proposal: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  won: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  lost: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

export const LEAD_PRIORITY_CLASSES: Record<LeadPriority, string> = {
  low: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  medium: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  high: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}
