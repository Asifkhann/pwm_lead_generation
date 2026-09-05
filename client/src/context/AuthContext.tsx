import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import { apiClient, isUnauthorized } from '../api/client'
import type { Session } from '../types/user'
import { AuthContext, type AuthContextValue } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // Restore the session from the cookie on first load.
  useEffect(() => {
    let cancelled = false

    authApi
      .fetchSession()
      .then((restored) => {
        if (!cancelled) setSession(restored)
      })
      .catch((error) => {
        // A missing session is the normal signed-out case, not an error.
        if (!cancelled && !isUnauthorized(error)) console.error('[auth] session check failed', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  /**
   * If the session expires while the app is open, drop it so the guarded
   * routes send the user back to the sign-in page instead of showing errors.
   */
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        const url = (error as { config?: { url?: string } })?.config?.url ?? ''
        if (isUnauthorized(error) && !url.includes('/auth/')) setSession(null)
        return Promise.reject(error)
      },
    )

    return () => apiClient.interceptors.response.eject(interceptor)
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      setSession(await authApi.login(email, password))
      // Never show the previous user's data.
      queryClient.clear()
    },
    [queryClient],
  )

  const signOut = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setSession(null)
      queryClient.clear()
    }
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      permissions: session?.permissions ?? [],
      isLoading,
      can: (permission) => session?.permissions.includes(permission) ?? false,
      signIn,
      signOut,
    }),
    [session, isLoading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
