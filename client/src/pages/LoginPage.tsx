import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { getApiErrorMessage } from '../api/client'
import { controlClass } from '../components/form/controlClass'

export default function LoginPage() {
  const { user, isLoading, signIn } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [isSubmitting, setSubmitting] = useState(false)

  if (!isLoading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    setSubmitting(true)

    try {
      await signIn(email.trim(), password)
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    } catch (caught) {
      setError(getApiErrorMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            {settings.organisationName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((word) => word[0]?.toUpperCase() ?? '')
              .join('')}
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              {settings.organisationName}
            </h1>
            <p className="text-xs text-slate-500">Lead Generation &amp; Sales Management</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          noValidate
        >
          <h2 className="text-sm font-semibold text-slate-900">Sign in</h2>
          <p className="mt-0.5 text-xs text-slate-500">Use the account your admin gave you.</p>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`mt-1.5 ${controlClass()}`}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`mt-1.5 ${controlClass()}`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
