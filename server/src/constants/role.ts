/**
 * Roles and what each may do. Adding a role means adding one entry here and
 * listing its permissions — nothing else in the codebase needs to change.
 */

export const ROLES = ['admin', 'senior_manager'] as const
export type Role = (typeof ROLES)[number]

export const PERMISSIONS = [
  'leads:read',
  'leads:write',
  'leads:delete',
  'communications:write',
  'followups:write',
  'reports:read',
  'notes:moderate',
  'users:manage',
  'settings:manage',
] as const
export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  senior_manager: [
    'leads:read',
    'leads:write',
    'communications:write',
    'followups:write',
    'reports:read',
  ],
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  senior_manager: 'Senior Manager',
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
