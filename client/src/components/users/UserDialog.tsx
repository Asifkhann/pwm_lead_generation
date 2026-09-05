import { useState } from 'react'
import Modal from '../Modal'
import { controlClass } from '../form/controlClass'
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from '../../constants/role'
import type { User, UserPayload } from '../../types/user'

interface UserDialogProps {
  isOpen: boolean
  isSaving: boolean
  /** Null when adding someone new. */
  user: User | null
  error?: string
  fieldErrors?: Record<string, string>
  onClose: () => void
  onSave: (payload: UserPayload) => void
}

export default function UserDialog({
  isOpen,
  isSaving,
  user,
  error,
  fieldErrors,
  onClose,
  onSave,
}: UserDialogProps) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [role, setRole] = useState<Role>(user?.role ?? 'senior_manager')
  const [password, setPassword] = useState('')

  const labelClass = 'block text-xs font-medium text-slate-700'
  const fieldError = (field: string) => fieldErrors?.[field]

  const handleSave = () => {
    onSave({
      name: name.trim(),
      email: email.trim(),
      role,
      // On edit, an empty password means "leave it alone".
      ...(password ? { password } : {}),
    })
  }

  return (
    <Modal
      title={user ? 'Edit user' : 'Add user'}
      description={user ? user.email : 'They will sign in with this email and password.'}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : user ? 'Save changes' : 'Create user'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && !fieldErrors && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="userName" className={labelClass}>
            Name <span className="text-rose-600">*</span>
          </label>
          <input
            id="userName"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={`mt-1.5 ${controlClass(Boolean(fieldError('name')))}`}
          />
          {fieldError('name') && <p className="mt-1 text-xs text-rose-600">{fieldError('name')}</p>}
        </div>

        <div>
          <label htmlFor="userEmail" className={labelClass}>
            Email <span className="text-rose-600">*</span>
          </label>
          <input
            id="userEmail"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`mt-1.5 ${controlClass(Boolean(fieldError('email')))}`}
          />
          {fieldError('email') && (
            <p className="mt-1 text-xs text-rose-600">{fieldError('email')}</p>
          )}
        </div>

        <div>
          <label htmlFor="userRole" className={labelClass}>
            Role
          </label>
          <select
            id="userRole"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            className={`mt-1.5 bg-white ${controlClass(Boolean(fieldError('role')))}`}
          >
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        <div>
          <label htmlFor="userPassword" className={labelClass}>
            Password {!user && <span className="text-rose-600">*</span>}
          </label>
          <input
            id="userPassword"
            type="password"
            autoComplete="new-password"
            value={password}
            placeholder={user ? 'Leave blank to keep the current password' : 'At least 8 characters'}
            onChange={(event) => setPassword(event.target.value)}
            className={`mt-1.5 ${controlClass(Boolean(fieldError('password')))}`}
          />
          {fieldError('password') && (
            <p className="mt-1 text-xs text-rose-600">{fieldError('password')}</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
