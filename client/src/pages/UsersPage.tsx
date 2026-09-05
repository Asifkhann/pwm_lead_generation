import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, deleteUser, fetchUsers, updateUser } from '../api/users'
import { getApiErrorMessage, getApiFieldErrors } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS } from '../constants/role'
import type { User, UserPayload } from '../types/user'
import { formatDate } from '../utils/format'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import ConfirmDialog from '../components/ConfirmDialog'
import UserDialog from '../components/users/UserDialog'
import { PlusIcon } from '../components/Icons'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  const [dialogUser, setDialogUser] = useState<User | null>(null)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<User | null>(null)

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const save = useMutation({
    mutationFn: (payload: UserPayload) =>
      dialogUser ? updateUser(dialogUser.id, payload) : createUser(payload),
    onSuccess: () => {
      void refresh()
      setDialogOpen(false)
      setDialogUser(null)
    },
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => void refresh(),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      void refresh()
      setDeleting(null)
    },
  })

  const openNew = () => {
    setDialogUser(null)
    setDialogOpen(true)
  }

  const openEdit = (user: User) => {
    setDialogUser(user)
    setDialogOpen(true)
  }

  const actionError = toggleActive.error ?? remove.error

  return (
    <>
      <PageHeader
        title="Users"
        description="Who can sign in, and what they are allowed to do."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" />
            Add user
          </button>
        }
      />

      {actionError && (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {getApiErrorMessage(actionError)}
        </p>
      )}

      <Card>
        {usersQuery.isPending && (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {usersQuery.isError && (
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">Could not load users</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {getApiErrorMessage(usersQuery.error)}
            </p>
            <button
              type="button"
              onClick={() => void usersQuery.refetch()}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        )}

        {usersQuery.data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Name', 'Email', 'Role', 'Status', 'Last sign-in', ''].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="py-2 pr-4 text-xs font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.map((user) => {
                  const isSelf = user.id === currentUser?.id
                  return (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0">
                      <th scope="row" className="py-3 pr-4 font-medium text-slate-900">
                        {user.name}
                        {isSelf && <span className="ml-2 text-xs font-normal text-slate-400">You</span>}
                      </th>
                      <td className="py-3 pr-4 break-all text-slate-700">{user.email}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-500/20 ring-inset">
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                              : 'bg-slate-100 text-slate-500 ring-slate-500/20'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-slate-600">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isSelf || toggleActive.isPending}
                            title={isSelf ? 'You cannot disable your own account' : undefined}
                            onClick={() =>
                              toggleActive.mutate({ id: user.id, isActive: !user.isActive })
                            }
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {user.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            title={isSelf ? 'You cannot delete your own account' : undefined}
                            onClick={() => setDeleting(user)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isDialogOpen && (
        <UserDialog
          isOpen
          key={dialogUser?.id ?? 'new'}
          user={dialogUser}
          isSaving={save.isPending}
          error={save.isError ? getApiErrorMessage(save.error) : undefined}
          fieldErrors={save.isError ? getApiFieldErrors(save.error) : undefined}
          onClose={() => {
            setDialogOpen(false)
            setDialogUser(null)
            save.reset()
          }}
          onSave={(payload) => save.mutate(payload)}
        />
      )}

      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete user"
        message={`${deleting?.name ?? 'This user'} will no longer be able to sign in. This cannot be undone.`}
        isWorking={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
