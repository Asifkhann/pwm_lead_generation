import type { ComponentType, SVGProps } from 'react'
import type { Permission } from '../../constants/role'
import {
  ActivityIcon,
  DashboardIcon,
  FollowUpsIcon,
  LeadsIcon,
  ReportsIcon,
  SettingsIcon,
  UsersIcon,
} from '../Icons'

export interface NavItem {
  label: string
  to: string
  /** Only the index route needs exact matching. */
  end?: boolean
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** When set, the item is hidden from users without this permission. */
  permission?: Permission
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', end: true, icon: DashboardIcon },
  { label: 'Leads', to: '/leads', icon: LeadsIcon },
  { label: 'Follow-ups', to: '/follow-ups', icon: FollowUpsIcon },
  { label: 'Activity', to: '/activity', icon: ActivityIcon },
  { label: 'Reports', to: '/reports', icon: ReportsIcon },
  { label: 'Users', to: '/users', icon: UsersIcon, permission: 'users:manage' },
  { label: 'Settings', to: '/settings', icon: SettingsIcon },
]

/** Hides nav items the signed-in user is not allowed to open. */
export function visibleNavItems(can: (permission: Permission) => boolean): NavItem[] {
  return navItems.filter((item) => !item.permission || can(item.permission))
}
