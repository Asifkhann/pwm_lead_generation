import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { changePassword } from '../api/auth'
import { getApiErrorMessage, getApiFieldErrors } from '../api/client'
import Modal from './Modal'
import { controlClass } from './form/controlClass'

interface ChangePasswordDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChangePasswordDialog({ isOpen, onClose }: ChangePasswordDialogProps) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mismatch, setMismatch] = useState<string>()
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => setDone(true),
  })

  const fieldErrors = mutation.isError ? getApiFieldErrors(mutation.error) : undefined
  const labelClass = 'block text-xs font-medium text-slate-700'

  const close = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setMismatch(undefined)
    setDone(false)
    mutation.reset()
    onClose()
  }

  const submit = () => {
    if (next !== confirm) {
      setMismatch('The two passwords do not match')
      return
    }
    setMismatch(undefined)
    mutation.mutate()
  }

  return (
    <Modal
      title="Change password"
      description={done ? undefined : 'Confirm your current password to set a new one.'}
      isOpen={isOpen}
      onClose={close}
      footer={
        done ? (
          <button
            type="button"
            onClick={close}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Done
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={close}
              disabled={mutation.isPending}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={mutation.isPending || !current || !next || !confirm}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving…' : 'Update password'}
            </button>
          </>
        )
      }
    >
      {done ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Your password has been updated. Use it the next time you sign in.
        </p>
      ) : (
        <div className="space-y-4">
          {mutation.isError && !fieldErrors && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {getApiErrorMessage(mutation.error)}
            </p>
          )}

          <div>
            <label htmlFor="currentPassword" className={labelClass}>
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              className={`mt-1.5 ${controlClass(Boolean(fieldErrors?.currentPassword))}`}
            />
            {fieldErrors?.currentPassword && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className={labelClass}>
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              className={`mt-1.5 ${controlClass(Boolean(fieldErrors?.newPassword))}`}
            />
            {fieldErrors?.newPassword && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.newPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={`mt-1.5 ${controlClass(Boolean(mismatch))}`}
            />
            {mismatch && <p className="mt-1 text-xs text-rose-600">{mismatch}</p>}
          </div>
        </div>
      )}
    </Modal>
  )
}
