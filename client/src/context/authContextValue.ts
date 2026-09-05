import { createContext } from 'react'
import type { Permission } from '../constants/role'
import type { User } from '../types/user'

export interface AuthContextValue {
  user: User | null
  permissions: Permission[]
  /** False once the initial session check has finished. */
  isLoading: boolean
  can: (permission: Permission) => boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

/** Kept out of the provider file so fast refresh keeps working. */
export const AuthContext = createContext<AuthContextValue | null>(null)
