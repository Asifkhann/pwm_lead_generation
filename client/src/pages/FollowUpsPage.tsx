import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeFollowUp,
  createFollowUp,
  deleteFollowUp,
  fetchFollowUps,
  updateFollowUp,
} from '../api/followUps'
import { fetchLeadFilterOptions } from '../api/leads'
import { getApiErrorMessage } from '../api/client'
import type { FollowUp, FollowUpPayload } from '../types/followUp'
import { toDateInputValue } from '../utils/format'
import PageHeader from '../components/PageHeader'
import Select from '../components/Select'
import ConfirmDialog from '../components/ConfirmDialog'
import FollowUpCard from '../components/followups/FollowUpCard'
import FollowUpDialog from '../components/followups/FollowUpDialog'
import { FollowUpsIcon, PlusIcon } from '../components/Icons'

interface SectionProps {
  title: string
  description: string
  count: number
  tone: 'danger' | 'accent' | 'neutral'
  emptyText: string
  children: React.ReactNode
  isEmpty: boolean
}

const toneClasses = {
  danger: 'bg-rose-100 text-rose-800',
  accent: 'bg-amber-100 text-amber-800',
  neutral: 'bg-slate-100 text-slate-700',
}

function Section({
  title,
  description,
  count,
  tone,
  emptyText,
  isEmpty,
  children,
}: SectionProps) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
          {count}
        </span>
        <p className="w-full text-xs text-slate-500 sm:w-auto">{description}</p>
      </div>

      {isEmpty ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-3">{children}</ul>
      )}
    </section>
  )
}

export default function FollowUpsPage() {
  const queryClient = useQueryClient()
  const [manager, setManager] = useState('')
  const [rescheduling, setRescheduling] = useState<FollowUp | null>(null)
  const [isCreating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<FollowUp | null>(null)

  const followUpsQuery = useQuery({
    queryKey: ['followUps', manager],
    queryFn: () => fetchFollowUps({ assignedTo: manager || undefined }),
  })

  const optionsQuery = useQuery({
    queryKey: ['leadFilterOptions'],
    queryFn: fetchLeadFilterOptions,
    staleTime: 5 * 60_000,
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['followUps'] })
    void queryClient.invalidateQueries({ queryKey: ['leads'] })
  }

  const complete = useMutation({
    mutationFn: (id: string) => completeFollowUp(id),
    onSuccess: refresh,
  })

  const reschedule = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FollowUpPayload }) =>
      updateFollowUp(id, payload),
    onSuccess: () => {
      refresh()
      setRescheduling(null)
    },
  })

  const create = useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: FollowUpPayload }) =>
      createFollowUp(leadId, payload),
    onSuccess: () => {
      refresh()
      setCreating(false)
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteFollowUp(id),
    onSuccess: () => {
      refresh()
      setDeleting(null)
    },
  })

  const isWorking = complete.isPending || remove.isPending
  const data = followUpsQuery.data
  const actionError = complete.error ?? remove.error

  const cardProps = (followUp: FollowUp, isOverdue: boolean) => ({
    followUp,
    isOverdue,
    isWorking,
    onComplete: (item: FollowUp) => complete.mutate(item.id),
    onReschedule: setRescheduling,
    onDelete: setDeleting,
  })

  return (
    <>
      <PageHeader
        title="Follow-ups"
        description="Everything due today, overdue and coming up next."
        actions={
          <>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <PlusIcon className="h-4 w-4" />
              Schedule follow-up
            </button>
            <div className="w-44">
            <Select
              label="Manager"
              placeholder="All managers"
              value={manager}
              options={(optionsQuery.data?.managers ?? []).map((user) => ({
                value: user.id,
                label: user.name,
              }))}
              disabled={!optionsQuery.data}
              onChange={setManager}
            />
            </div>
          </>
        }
      />

      {followUpsQuery.isPending && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      )}

      {followUpsQuery.isError && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Could not load follow-ups</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {getApiErrorMessage(followUpsQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => void followUpsQuery.refetch()}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      )}

      {data && (
        <>
          {actionError && (
            <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {getApiErrorMessage(actionError)}
            </p>
          )}

          {data.counts.overdue + data.counts.today + data.counts.upcoming === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <FollowUpsIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">Nothing scheduled</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Schedule a follow-up from a lead's page, or when you record a conversation.
              </p>
            </div>
          ) : (
            <div className={`space-y-8 ${followUpsQuery.isFetching ? 'opacity-60' : ''}`}>
              <Section
                title="Overdue"
                description="Past their due date — deal with these first."
                count={data.counts.overdue}
                tone="danger"
                isEmpty={data.overdue.length === 0}
                emptyText="Nothing overdue. Well done."
              >
                {data.overdue.map((followUp) => (
                  <FollowUpCard key={followUp.id} {...cardProps(followUp, true)} />
                ))}
              </Section>

              <Section
                title="Due today"
                description="Scheduled for today."
                count={data.counts.today}
                tone="accent"
                isEmpty={data.today.length === 0}
                emptyText="Nothing due today."
              >
                {data.today.map((followUp) => (
                  <FollowUpCard key={followUp.id} {...cardProps(followUp, false)} />
                ))}
              </Section>

              <Section
                title="Upcoming"
                description="Due in the next 30 days."
                count={data.counts.upcoming}
                tone="neutral"
                isEmpty={data.upcoming.length === 0}
                emptyText="Nothing coming up in the next 30 days."
              >
                {data.upcoming.map((followUp) => (
                  <FollowUpCard key={followUp.id} {...cardProps(followUp, false)} />
                ))}
              </Section>
            </div>
          )}
        </>
      )}

      {isCreating && (
        <FollowUpDialog
          isOpen
          withLeadPicker
          title="Schedule follow-up"
          isSaving={create.isPending}
          error={create.isError ? getApiErrorMessage(create.error) : undefined}
          initialDate=""
          initialNote=""
          onClose={() => {
            setCreating(false)
            create.reset()
          }}
          onSave={(payload, lead) => lead && create.mutate({ leadId: lead.id, payload })}
        />
      )}

      {rescheduling && (
        <FollowUpDialog
          isOpen
          key={rescheduling.id}
          title="Reschedule follow-up"
          isSaving={reschedule.isPending}
          error={reschedule.isError ? getApiErrorMessage(reschedule.error) : undefined}
          initialDate={toDateInputValue(rescheduling.dueDate)}
          initialNote={rescheduling.note}
          onClose={() => setRescheduling(null)}
          onSave={(payload) => reschedule.mutate({ id: rescheduling.id, payload })}
        />
      )}

      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete follow-up"
        message="This follow-up will be removed. This cannot be undone."
        isWorking={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
