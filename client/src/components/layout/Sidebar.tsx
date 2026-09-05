import { NavLink } from 'react-router-dom'
import { visibleNavItems } from './navigation'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../hooks/useSettings'
import { CloseIcon } from '../Icons'

interface SidebarProps {
  /** Mobile drawer visibility — ignored on large screens where the sidebar is static. */
  isOpen: boolean
  onClose: () => void
}

/** Up to two initials from the organisation name, e.g. "Perfect Web Metrix" -> "PW". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  const base =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
  return isActive
    ? `${base} bg-slate-800 text-white`
    : `${base} text-slate-300 hover:bg-slate-800/60 hover:text-white`
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { can } = useAuth()
  const { settings } = useSettings()
  const items = visibleNavItems(can)

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-900">
            {initialsOf(settings.organisationName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {settings.organisationName}
            </p>
            <p className="truncate text-xs text-slate-400">Sales Dashboard</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map(({ label, to, end, icon: ItemIcon }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={onClose}>
              <ItemIcon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <p className="truncate text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {settings.organisationName}
          </p>
        </div>
      </aside>
    </>
  )
}
