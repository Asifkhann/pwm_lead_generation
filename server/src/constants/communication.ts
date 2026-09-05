/** Shared communication enums. Values are stored in MongoDB, so keep them stable. */

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
