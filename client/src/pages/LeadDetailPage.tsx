import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteLead, fetchLead, patchLead } from '../api/leads'
import {
  createCommunication,
  deleteCommunication,
  fetchCommunications,
  updateCommunication,
} from '../api/communications'
import { createNote, deleteNote, fetchNotes, updateNote } from '../api/notes'
import {
  completeFollowUp,
  createFollowUp,
  deleteFollowUp,
  fetchLeadFollowUps,
  updateFollowUp,
} from '../api/followUps'
import { getApiErrorMessage } from '../api/client'
import type { Lead, LeadPatch } from '../types/lead'
import type {
  Communication,
  CommunicationFormValues,
  CommunicationPayload,
} from '../types/communication'
import type { FollowUpPayload, LeadFollowUp } from '../types/followUp'
import type { Note } from '../types/note'
import {
  LEAD_PRIORITIES,
  LEAD_PRIORITY_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadPriority,
  type LeadStatus,
} from '../constants/lead'
import {
  daysFromToday,
  describeRelativeDay,
  formatDate,
  formatMoney,
  toDateInputValue,
  toTimeInputValue,
} from '../utils/format'
import Card from '../components/Card'
import DetailField from '../components/leads/DetailField'
import TagGroup from '../components/leads/TagGroup'
import WebsiteLink from '../components/leads/WebsiteLink'
import AddNoteDialog from '../components/leads/AddNoteDialog'
import CommunicationDialog from '../components/leads/CommunicationDialog'
import CommunicationTimeline from '../components/leads/CommunicationTimeline'
import NotesList from '../components/leads/NotesList'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuth } from '../hooks/useAuth'
import FollowUpDialog from '../components/followups/FollowUpDialog'
import { PriorityBadge, StatusBadge } from '../components/Badge'
import { FollowUpsIcon, LeadsIcon, PhoneIcon } from '../components/Icons'

type Dialog = 'note' | 'followUp' | 'communication' | null

/** A blank conversation defaults to now, which is when it is usually logged. */
function newCommunicationValues(contactPerson: string): CommunicationFormValues {
  const now = new Date().toISOString()
  return {
    date: toDateInputValue(now),
    time: toTimeInputValue(now),
    type: 'phone',
    contactPerson,
    outcome: 'connected',
    discussionNotes: '',
    clientRequirements: '',
    clientConcerns: '',
    servicesDiscussed: [],
    nextAction: '',
    followUpDate: '',
  }
}

function communicationToFormValues(communication: Communication): CommunicationFormValues {
  return {
    date: toDateInputValue(communication.occurredAt),
    time: toTimeInputValue(communication.occurredAt),
    type: communication.type,
    contactPerson: communication.contactPerson,
    outcome: communication.outcome,
    discussionNotes: communication.discussionNotes,
    clientRequirements: communication.clientRequirements,
    clientConcerns: communication.clientConcerns,
    servicesDiscussed: communication.servicesDiscussed,
    nextAction: communication.nextAction,
    followUpDate: toDateInputValue(communication.followUpDate),
  }
}

const actionButtonClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-xl bg-slate-100 lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  )
}

export default function LeadDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { can, user } = useAuth()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<Communication | null>(null)
  const [deletingCommunication, setDeletingCommunication] = useState<Communication | null>(null)
  const [editingFollowUp, setEditingFollowUp] = useState<LeadFollowUp | null>(null)
  const [deletingNote, setDeletingNote] = useState<Note | null>(null)

  const leadQuery = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLead(id),
    enabled: Boolean(id),
  })

  const notesQuery = useQuery({
    queryKey: ['notes', id],
    queryFn: () => fetchNotes(id),
    enabled: Boolean(id),
  })

  const followUpsQuery = useQuery({
    queryKey: ['leadFollowUps', id],
    queryFn: () => fetchLeadFollowUps(id),
    enabled: Boolean(id),
  })

  const communicationsQuery = useQuery({
    queryKey: ['communications', id],
    queryFn: () => fetchCommunications(id),
    enabled: Boolean(id),
  })

  const mutation = useMutation({
    mutationFn: (patch: LeadPatch) => patchLead(id, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(['lead', id], updated)
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
      setDialog(null)
    },
  })

  /** Logging a conversation can change the lead's contact and follow-up dates. */
  const refreshAfterCommunication = () => {
    void queryClient.invalidateQueries({ queryKey: ['communications', id] })
    void queryClient.invalidateQueries({ queryKey: ['lead', id] })
    void queryClient.invalidateQueries({ queryKey: ['leads'] })
  }

  const saveCommunication = useMutation({
    mutationFn: (payload: CommunicationPayload) =>
      editingCommunication
        ? updateCommunication(editingCommunication.id, payload)
        : createCommunication(id, payload),
    onSuccess: () => {
      refreshAfterCommunication()
      setDialog(null)
      setEditingCommunication(null)
    },
  })

  const removeCommunication = useMutation({
    mutationFn: (communicationId: string) => deleteCommunication(communicationId),
    onSuccess: () => {
      refreshAfterCommunication()
      setDeletingCommunication(null)
    },
  })

  const refreshFollowUps = () => {
    void queryClient.invalidateQueries({ queryKey: ['leadFollowUps', id] })
    void queryClient.invalidateQueries({ queryKey: ['lead', id] })
    void queryClient.invalidateQueries({ queryKey: ['leads'] })
    void queryClient.invalidateQueries({ queryKey: ['followUps'] })
  }

  const saveFollowUp = useMutation({
    mutationFn: (payload: FollowUpPayload) =>
      editingFollowUp ? updateFollowUp(editingFollowUp.id, payload) : createFollowUp(id, payload),
    onSuccess: () => {
      refreshFollowUps()
      setDialog(null)
      setEditingFollowUp(null)
    },
  })

  const followUpAction = useMutation({
    mutationFn: async ({
      action,
      followUpId,
    }: {
      action: 'complete' | 'delete'
      followUpId: string
    }) => {
      if (action === 'complete') await completeFollowUp(followUpId)
      else await deleteFollowUp(followUpId)
    },
    onSuccess: refreshFollowUps,
  })

  const refreshNotes = () => queryClient.invalidateQueries({ queryKey: ['notes', id] })

  const addNote = useMutation({
    mutationFn: (body: string) => createNote(id, body),
    onSuccess: () => {
      void refreshNotes()
      setDialog(null)
    },
  })

  const editNote = useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; body: string }) => updateNote(noteId, body),
    onSuccess: () => void refreshNotes(),
  })

  const removeNote = useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => {
      void refreshNotes()
      setDeletingNote(null)
    },
  })

  const removeLead = useMutation({
    mutationFn: () => deleteLead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
      void queryClient.invalidateQueries({ queryKey: ['followUps'] })
      navigate('/leads', { replace: true })
    },
  })

  const openNewFollowUp = () => {
    setEditingFollowUp(null)
    setDialog('followUp')
  }

  const openNewCommunication = () => {
    setEditingCommunication(null)
    setDialog('communication')
  }

  const openEditCommunication = (communication: Communication) => {
    setEditingCommunication(communication)
    setDialog('communication')
  }

  if (leadQuery.isPending) return <DetailSkeleton />

  if (leadQuery.isError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <LeadsIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-sm font-semibold text-slate-900">Could not load this lead</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          {getApiErrorMessage(leadQuery.error)}
        </p>
        <Link
          to="/leads"
          className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to leads
        </Link>
      </div>
    )
  }

  const lead: Lead = leadQuery.data
  const allFollowUps = followUpsQuery.data ?? []
  const pendingFollowUps = allFollowUps.filter((item) => item.status === 'pending')
  const completedFollowUps = allFollowUps.filter((item) => item.status === 'completed')
  const location = [lead.city, lead.country].filter(Boolean).join(', ')
  const socialEntries = (
    [
      ['Facebook', lead.socialMedia.facebook],
      ['Instagram', lead.socialMedia.instagram],
      ['LinkedIn', lead.socialMedia.linkedin],
      ['Other', lead.socialMedia.other],
    ] as const
  ).filter(([, value]) => value.trim())

  return (
    <>
      <div className="mb-6">
        <Link to="/leads" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to leads
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">{lead.companyName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {[lead.businessType, lead.industry, location].filter(Boolean).join(' · ') ||
                'No business details yet'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={actionButtonClass}
              onClick={() => setDialog('note')}
              disabled={mutation.isPending}
            >
              Add note
            </button>
            <button
              type="button"
              className={actionButtonClass}
              onClick={openNewFollowUp}
              disabled={saveFollowUp.isPending}
            >
              Schedule follow-up
            </button>
            <button
              type="button"
              className={actionButtonClass}
              onClick={openNewCommunication}
              disabled={saveCommunication.isPending}
            >
              Add communication
            </button>
            <Link
              to={`/leads/${lead.id}/edit`}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Edit lead
            </Link>
            {can('leads:delete') && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={removeLead.isPending}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {removeLead.isError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {getApiErrorMessage(removeLead.error)}
          </p>
        )}

        {mutation.isError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Company information">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Company name" value={lead.companyName} />
              <DetailField label="Business type" value={lead.businessType} />
              <DetailField label="Industry" value={lead.industry} />
              <DetailField label="Lead source" value={LEAD_SOURCE_LABELS[lead.leadSource]} />
              <DetailField
                label="Deal value"
                value={lead.dealValue === null ? '' : formatMoney(lead.dealValue, lead.currency)}
              />
              <DetailField label="Website">
                {lead.website.trim() ? <WebsiteLink website={lead.website} /> : null}
              </DetailField>
              <DetailField label="City" value={lead.city} />
              <DetailField label="Address" value={lead.address} fullWidth />
              <DetailField label="Country" value={lead.country} />
            </dl>
          </Card>

          <Card title="Contact information">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Owner" value={lead.ownerName} />
              <DetailField label="Contact person" value={lead.contactPerson} />
              <DetailField label="Phone">
                {lead.phone.trim() ? (
                  <a href={`tel:${lead.phone}`} className="text-slate-900 hover:underline">
                    {lead.phone}
                  </a>
                ) : null}
              </DetailField>
              <DetailField label="Email">
                {lead.email.trim() ? (
                  <a href={`mailto:${lead.email}`} className="break-all text-slate-900 hover:underline">
                    {lead.email}
                  </a>
                ) : null}
              </DetailField>
            </dl>
          </Card>

          <Card title="Online presence" description="Profiles found for this business.">
            {socialEntries.length > 0 ? (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {socialEntries.map(([label, value]) => (
                  <DetailField key={label} label={label}>
                    <WebsiteLink website={value} />
                  </DetailField>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-slate-400">No social profiles recorded.</p>
            )}
          </Card>

          <Card title="Business analysis" description="What is wrong today and what you can sell.">
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-medium text-slate-500">Problems found</h4>
                <div className="mt-2">
                  <TagGroup
                    values={lead.problemsFound}
                    tone="amber"
                    emptyText="No problems recorded yet."
                  />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-slate-500">Opportunities</h4>
                <div className="mt-2">
                  <TagGroup
                    values={lead.opportunities}
                    tone="sky"
                    emptyText="No opportunities recorded yet."
                  />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-slate-500">Services required</h4>
                <div className="mt-2">
                  <TagGroup values={lead.servicesRequired} emptyText="No services selected yet." />
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Communication history"
            description="Every call, message and meeting with this lead."
            actions={
              <button
                type="button"
                onClick={openNewCommunication}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Add communication
              </button>
            }
          >
            {communicationsQuery.isPending && (
              <div className="space-y-3" aria-busy="true">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            )}

            {communicationsQuery.isError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm text-rose-700">
                  {getApiErrorMessage(communicationsQuery.error)}
                </p>
                <button
                  type="button"
                  onClick={() => void communicationsQuery.refetch()}
                  className="mt-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                >
                  Try again
                </button>
              </div>
            )}

            {communicationsQuery.data &&
              (communicationsQuery.data.length > 0 ? (
                <CommunicationTimeline
                  communications={communicationsQuery.data}
                  onEdit={openEditCommunication}
                  onDelete={setDeletingCommunication}
                />
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <PhoneIcon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">No conversations yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                    Record your first call, message or meeting to start the history.
                  </p>
                  <button
                    type="button"
                    onClick={openNewCommunication}
                    className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Add communication
                  </button>
                </div>
              ))}
          </Card>

          <Card
            title="Notes"
            actions={
              <button
                type="button"
                onClick={() => setDialog('note')}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Add note
              </button>
            }
          >
            {notesQuery.isPending && (
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" aria-busy="true" />
            )}

            {notesQuery.isError && (
              <p className="text-sm text-rose-700">{getApiErrorMessage(notesQuery.error)}</p>
            )}

            {(editNote.isError || removeNote.isError) && (
              <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {getApiErrorMessage(editNote.error ?? removeNote.error)}
              </p>
            )}

            {notesQuery.data &&
              (notesQuery.data.length > 0 ? (
                <NotesList
                  notes={notesQuery.data}
                  currentUserId={user?.id ?? null}
                  canModerate={can('notes:moderate')}
                  isWorking={editNote.isPending || removeNote.isPending}
                  onUpdate={(noteId, body) => editNote.mutate({ noteId, body })}
                  onDelete={setDeletingNote}
                />
              ) : (
                <p className="text-sm text-slate-400">No notes yet.</p>
              ))}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Sales information" description="Changes here save immediately.">
            <div className="space-y-4">
              <div>
                <label htmlFor="detailStatus" className="block text-xs font-medium text-slate-500">
                  Status
                </label>
                <select
                  id="detailStatus"
                  value={lead.status}
                  disabled={mutation.isPending}
                  onChange={(event) =>
                    mutation.mutate({ status: event.target.value as LeadStatus })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none disabled:opacity-50"
                >
                  {LEAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {LEAD_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="detailPriority" className="block text-xs font-medium text-slate-500">
                  Priority
                </label>
                <select
                  id="detailPriority"
                  value={lead.priority}
                  disabled={mutation.isPending}
                  onChange={(event) =>
                    mutation.mutate({ priority: event.target.value as LeadPriority })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none disabled:opacity-50"
                >
                  {LEAD_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {LEAD_PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              </div>

              <dl className="space-y-4 border-t border-slate-100 pt-4">
                <DetailField label="Assigned manager" value={lead.assignedTo?.name ?? ''} />
                <DetailField label="Created" value={formatDate(lead.createdAt)} />
                <DetailField label="Last updated" value={formatDate(lead.updatedAt)} />
              </dl>
            </div>
          </Card>

          <Card
            title="Follow-ups"
            description="Scheduled work for this lead."
            actions={
              <button
                type="button"
                onClick={openNewFollowUp}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Schedule
              </button>
            }
          >
            <dl className="mb-4 border-b border-slate-100 pb-4">
              <DetailField label="Last contacted" value={formatDate(lead.lastContactedAt)} />
            </dl>

            {followUpsQuery.isPending && (
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" aria-busy="true" />
            )}

            {followUpsQuery.isError && (
              <p className="text-sm text-rose-700">{getApiErrorMessage(followUpsQuery.error)}</p>
            )}

            {followUpsQuery.data && pendingFollowUps.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <FollowUpsIcon className="h-4 w-4 shrink-0" />
                Nothing scheduled for this lead.
              </div>
            )}

            {pendingFollowUps.length > 0 && (
              <ul className="space-y-3">
                {pendingFollowUps.map((followUp) => {
                  const days = daysFromToday(followUp.dueDate)
                  const overdue = days !== null && days < 0
                  return (
                    <li
                      key={followUp.id}
                      className={`rounded-lg border p-3 ${
                        overdue ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {formatDate(followUp.dueDate)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${
                            overdue
                              ? 'bg-rose-100 text-rose-800 ring-rose-600/20'
                              : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                          }`}
                        >
                          {describeRelativeDay(followUp.dueDate)}
                        </span>
                      </div>

                      {followUp.note && (
                        <p className="mt-1.5 text-sm text-slate-700">{followUp.note}</p>
                      )}

                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={followUpAction.isPending}
                          onClick={() =>
                            followUpAction.mutate({ action: 'complete', followUpId: followUp.id })
                          }
                          className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFollowUp(followUp)
                            setDialog('followUp')
                          }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          disabled={followUpAction.isPending}
                          onClick={() =>
                            followUpAction.mutate({ action: 'delete', followUpId: followUp.id })
                          }
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {completedFollowUps.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-slate-500">
                  Completed ({completedFollowUps.length})
                </p>
                <ul className="mt-2 space-y-1.5">
                  {completedFollowUps.slice(0, 5).map((followUp) => (
                    <li key={followUp.id} className="text-xs text-slate-500">
                      <span className="text-slate-400 line-through">
                        {formatDate(followUp.dueDate)}
                      </span>
                      {followUp.note && <span> — {followUp.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>

      <AddNoteDialog
        isOpen={dialog === 'note'}
        isSaving={addNote.isPending}
        error={addNote.isError ? getApiErrorMessage(addNote.error) : undefined}
        onClose={() => {
          setDialog(null)
          addNote.reset()
        }}
        onSave={(note) => addNote.mutate(note)}
      />

      <ConfirmDialog
        isOpen={deletingNote !== null}
        title="Delete note"
        message="This note will be removed. This cannot be undone."
        isWorking={removeNote.isPending}
        onConfirm={() => deletingNote && removeNote.mutate(deletingNote.id)}
        onClose={() => setDeletingNote(null)}
      />

      {dialog === 'communication' && (
        <CommunicationDialog
          isOpen
          // Remount per entry so the dialog starts from the right values.
          key={editingCommunication?.id ?? 'new'}
          title={editingCommunication ? 'Edit communication' : 'Add communication'}
          isSaving={saveCommunication.isPending}
          error={
            saveCommunication.isError ? getApiErrorMessage(saveCommunication.error) : undefined
          }
          initialValues={
            editingCommunication
              ? communicationToFormValues(editingCommunication)
              : newCommunicationValues(lead.contactPerson || lead.ownerName)
          }
          onClose={() => {
            setDialog(null)
            setEditingCommunication(null)
          }}
          onSave={(payload) => saveCommunication.mutate(payload)}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete lead"
        message={`${lead.companyName} will be removed, along with its ${
          communicationsQuery.data?.length ?? 0
        } conversation(s) and ${allFollowUps.length} follow-up(s). This cannot be undone.`}
        confirmLabel="Delete lead"
        isWorking={removeLead.isPending}
        onConfirm={() => removeLead.mutate()}
        onClose={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        isOpen={deletingCommunication !== null}
        title="Delete communication"
        message="This conversation will be removed from the lead's history. This cannot be undone."
        isWorking={removeCommunication.isPending}
        onConfirm={() =>
          deletingCommunication && removeCommunication.mutate(deletingCommunication.id)
        }
        onClose={() => setDeletingCommunication(null)}
      />

      {dialog === 'followUp' && (
        <FollowUpDialog
          isOpen
          key={editingFollowUp?.id ?? 'new'}
          title={editingFollowUp ? 'Reschedule follow-up' : 'Schedule follow-up'}
          isSaving={saveFollowUp.isPending}
          error={saveFollowUp.isError ? getApiErrorMessage(saveFollowUp.error) : undefined}
          initialDate={editingFollowUp ? toDateInputValue(editingFollowUp.dueDate) : ''}
          initialNote={editingFollowUp?.note ?? ''}
          onClose={() => {
            setDialog(null)
            setEditingFollowUp(null)
          }}
          onSave={(payload) => saveFollowUp.mutate(payload)}
        />
      )}

    </>
  )
}
