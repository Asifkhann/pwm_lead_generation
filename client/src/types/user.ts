import type { Permission, Role } from '../constants/role'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Session {
  user: User
  permissions: Permission[]
}

export interface UserPayload {
  name: string
  email: string
  role: Role
  password?: string
  isActive?: boolean
}
