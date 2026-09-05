import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Permission } from '../constants/role'

interface ProtectedRouteProps {
  /** When set, the route also requires this permission. */
  permission?: Permission
}

/** Blocks a route until the session is known, then checks access. */
export default function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const { user, isLoading, can } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (permission && !can(permission)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">You do not have access to this page</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Ask an admin if you think you should be able to see it.
        </p>
      </div>
    )
  }

  return <Outlet />
}
