import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, updateSettings } from '../api/settings'
import { fetchHealth } from '../api/health'
import { getApiErrorMessage, getApiFieldErrors } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { CURRENCIES, CURRENCY_LABELS, type Currency } from '../constants/currency'
import type { SettingsPayload } from '../types/settings'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import StatusDot from '../components/StatusDot'
import { controlClass } from '../components/form/controlClass'

const labelClass = 'block text-xs font-medium text-slate-700'

function SystemStatus() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  })

  return (
    <Card
      title="System status"
      description="Live check of the API and database connection."
      actions={
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {isFetching ? 'Checking…' : 'Refresh'}
        </button>
      }
    >
      {isPending && (
        <div className="space-y-3" aria-busy="true">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <StatusDot tone="danger" label="API unreachable" />
          <p className="mt-1 text-sm text-rose-700">{getApiErrorMessage(error)}</p>
        </div>
      )}

      {data && (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">API</dt>
            <dd className="mt-1">
              <StatusDot tone="success" label={`Online (${data.environment})`} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Database</dt>
            <dd className="mt-1">
              <StatusDot
                tone={data.database.status === 'connected' ? 'success' : 'warning'}
                label={
                  data.database.status === 'connected'
                    ? `Connected${data.database.name ? ` — ${data.database.name}` : ''}`
                    : `MongoDB ${data.database.status}`
                }
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Uptime</dt>
            <dd className="mt-1 text-sm text-slate-700">{Math.round(data.uptime)}s</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Server time</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {new Date(data.timestamp).toLocaleString()}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  )
}

export default function SettingsPage() {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const canEdit = can('settings:manage')

  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: fetchSettings })

  // Only what the user changed is held in state; everything else is read
  // straight from the saved settings, so no effect is needed to seed a form.
  const [edits, setEdits] = useState<SettingsPayload>({})
  const [saved, setSaved] = useState(false)

  const valueOf = <K extends keyof SettingsPayload>(key: K): SettingsPayload[K] =>
    edits[key] ?? (settingsQuery.data?.[key] as SettingsPayload[K])

  const save = useMutation({
    mutationFn: () => updateSettings(edits),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated)
      // The follow-ups window and page size change what those pages request.
      void queryClient.invalidateQueries({ queryKey: ['followUps'] })
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
      setEdits({})
      setSaved(true)
    },
  })

  const fieldErrors = save.isError ? getApiFieldErrors(save.error) : undefined
  const setField = <K extends keyof SettingsPayload>(key: K, value: SettingsPayload[K]) => {
    setEdits((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  return (
    <>
      <PageHeader title="Settings" description="Workspace configuration and system status." />

      <div className="space-y-6">
        <Card
          title="Workspace"
          description={
            canEdit
              ? 'These apply to everyone using the dashboard.'
              : 'Only an admin can change these.'
          }
        >
          {settingsQuery.isPending && (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-9 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          )}

          {settingsQuery.isError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {getApiErrorMessage(settingsQuery.error)}
            </p>
          )}

          {settingsQuery.data && (
            <>
              {save.isError && !fieldErrors && (
                <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {getApiErrorMessage(save.error)}
                </p>
              )}
              {saved && (
                <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Settings saved.
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="organisationName" className={labelClass}>
                    Organisation name
                  </label>
                  <input
                    id="organisationName"
                    type="text"
                    disabled={!canEdit}
                    value={valueOf('organisationName') ?? ''}
                    onChange={(event) => setField('organisationName', event.target.value)}
                    className={`mt-1.5 ${controlClass(Boolean(fieldErrors?.organisationName))}`}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Shown in the sidebar and on the sign-in page.
                  </p>
                  {fieldErrors?.organisationName && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.organisationName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="defaultCurrency" className={labelClass}>
                    Default currency
                  </label>
                  <select
                    id="defaultCurrency"
                    disabled={!canEdit}
                    value={valueOf('defaultCurrency') ?? 'GBP'}
                    onChange={(event) =>
                      setField('defaultCurrency', event.target.value as Currency)
                    }
                    className={`mt-1.5 bg-white ${controlClass(Boolean(fieldErrors?.defaultCurrency))}`}
                  >
                    {CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {CURRENCY_LABELS[code]}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Used when a lead's country does not suggest one.
                  </p>
                </div>

                <div>
                  <label htmlFor="upcomingFollowUpDays" className={labelClass}>
                    Upcoming follow-up window
                  </label>
                  <input
                    id="upcomingFollowUpDays"
                    type="number"
                    min={1}
                    max={365}
                    disabled={!canEdit}
                    value={valueOf('upcomingFollowUpDays') ?? 30}
                    onChange={(event) =>
                      setField('upcomingFollowUpDays', Number(event.target.value))
                    }
                    className={`mt-1.5 ${controlClass(Boolean(fieldErrors?.upcomingFollowUpDays))}`}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    How many days ahead the Follow-ups page looks.
                  </p>
                  {fieldErrors?.upcomingFollowUpDays && (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors.upcomingFollowUpDays}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="leadsPerPage" className={labelClass}>
                    Leads per page
                  </label>
                  <input
                    id="leadsPerPage"
                    type="number"
                    min={5}
                    max={100}
                    disabled={!canEdit}
                    value={valueOf('leadsPerPage') ?? 20}
                    onChange={(event) => setField('leadsPerPage', Number(event.target.value))}
                    className={`mt-1.5 ${controlClass(Boolean(fieldErrors?.leadsPerPage))}`}
                  />
                  <p className="mt-1 text-xs text-slate-500">Rows shown on the leads list.</p>
                  {fieldErrors?.leadsPerPage && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.leadsPerPage}</p>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => save.mutate()}
                    disabled={save.isPending || Object.keys(edits).length === 0}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {save.isPending ? 'Saving…' : 'Save settings'}
                  </button>
                </div>
              )}
            </>
          )}
        </Card>

        <SystemStatus />
      </div>
    </>
  )
}
