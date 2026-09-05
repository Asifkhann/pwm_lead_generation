/** Mirrors server/src/constants/role.ts — values must stay in sync. */

export const ROLES = ['admin', 'senior_manager'] as const
export type Role = (typeof ROLES)[number]

export type Permission =
  | 'leads:read'
  | 'leads:write'
  | 'leads:delete'
  | 'communications:write'
  | 'followups:write'
  | 'reports:read'
  | 'notes:moderate'
  | 'users:manage'
  | 'settings:manage'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  senior_manager: 'Senior Manager',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full access, including managing users and deleting leads.',
  senior_manager: 'Manages leads, conversations and follow-ups. Cannot manage users.',
}
