import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { navItems } from './navigation'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_LABELS } from '../../constants/role'
import { MenuIcon, SearchIcon } from '../Icons'
import ChangePasswordDialog from '../ChangePasswordDialog'

interface HeaderProps {
  onOpenSidebar: () => void
}

/** Resolves the current route to its navigation label. */
function useCurrentPageTitle(): string {
  const { pathname } = useLocation()
  if (pathname === '/') return 'Dashboard'
  const match = navItems.find((item) => item.to !== '/' && pathname.startsWith(item.to))
  return match?.label ?? 'Not found'
}

/** Two initials for the avatar, e.g. "Zohaib Khan" -> "ZK". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const title = useCurrentPageTitle()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isPasswordOpen, setPasswordOpen] = useState(false)
  const [search, setSearch] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the menu on an outside click or Escape.
  useEffect(() => {
    if (!isMenuOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isMenuOpen])

  /** Sends the term to the leads list, which already owns search and filters. */
  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    const term = search.trim()
    if (!term) return
    navigate(`/leads?search=${encodeURIComponent(term)}`)
    setSearch('')
  }

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <form onSubmit={handleSearch} className="relative hidden sm:block">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search leads…"
            aria-label="Search leads"
            className="w-44 rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none lg:w-64"
          />
        </form>

        <div ref={menuRef} className="relative border-l border-slate-200 pl-2 sm:pl-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initialsOf(user?.name ?? '')}
            </span>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-sm font-medium text-slate-900">{user?.name}</span>
              <span className="block text-xs text-slate-500">
                {user ? ROLE_LABELS[user.role] : ''}
              </span>
            </span>
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setPasswordOpen(true)
                }}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                Change password
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleSignOut()}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordDialog isOpen={isPasswordOpen} onClose={() => setPasswordOpen(false)} />
    </header>
  )
}
