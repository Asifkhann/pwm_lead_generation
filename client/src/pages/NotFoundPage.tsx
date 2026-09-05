import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <p className="text-sm font-semibold text-slate-400">404</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">Page not found</h2>
      <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Back to home
      </Link>
    </div>
  )
}
