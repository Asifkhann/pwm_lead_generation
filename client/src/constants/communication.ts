/** Mirrors server/src/constants/communication.ts — values must stay in sync. */

export const COMMUNICATION_TYPES = ['phone', 'whatsapp', 'email', 'meeting', 'other'] as const
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number]

export const COMMUNICATION_OUTCOMES = [
  'connected',
  'no_answer',
  'callback_requested',
  'interested',
  'not_interested',
  'meeting_scheduled',
  'proposal_requested',
  'other',
] as const
export type CommunicationOutcome = (typeof COMMUNICATION_OUTCOMES)[number]

export const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  email: 'Email',
  meeting: 'Meeting',
  other: 'Other',
}

export const COMMUNICATION_OUTCOME_LABELS: Record<CommunicationOutcome, string> = {
  connected: 'Connected',
  no_answer: 'No answer',
  callback_requested: 'Callback requested',
  interested: 'Interested',
  not_interested: 'Not interested',
  meeting_scheduled: 'Meeting scheduled',
  proposal_requested: 'Proposal requested',
  other: 'Other',
}

export const COMMUNICATION_OUTCOME_CLASSES: Record<CommunicationOutcome, string> = {
  connected: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  no_answer: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  callback_requested: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  interested: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  not_interested: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  meeting_scheduled: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  proposal_requested: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  other: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}
