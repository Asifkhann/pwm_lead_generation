/** Shared follow-up enums. Values are stored in MongoDB, so keep them stable. */

export const FOLLOW_UP_STATUSES = ['pending', 'completed', 'cancelled'] as const
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number]
