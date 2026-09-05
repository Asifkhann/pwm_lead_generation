import { Link } from 'react-router-dom'
import type { FollowUp } from '../../types/followUp'
import { PriorityBadge, StatusBadge } from '../Badge'
import { describeRelativeDay, formatDate } from '../../utils/format'
import { TrashIcon } from '../Icons'

interface FollowUpCardProps {
  followUp: FollowUp
  isOverdue: boolean
  isWorking: boolean
  onComplete: (followUp: FollowUp) => void
  onReschedule: (followUp: FollowUp) => void
  onDelete: (followUp: FollowUp) => void
}

export default function FollowUpCard({
  followUp,
  isOverdue,
  isWorking,
  onComplete,
  onReschedule,
  onDelete,
}: FollowUpCardProps) {
  const { lead } = followUp
  const contact = lead.contactPerson || lead.ownerName

  return (
    <li
      className={`rounded-lg border bg-white p-4 ${
        isOverdue ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/leads/${lead.id}`}
            className="font-medium text-slate-900 hover:underline"
          >
            {lead.companyName}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500">
            {[contact, lead.phone, lead.city].filter(Boolean).join(' · ') || 'No contact details'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={lead.status} />
          <PriorityBadge priority={lead.priority} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${
            isOverdue
              ? 'bg-rose-100 text-rose-800 ring-rose-600/20'
              : 'bg-slate-100 text-slate-700 ring-slate-500/20'
          }`}
        >
          {formatDate(followUp.dueDate)} · {describeRelativeDay(followUp.dueDate)}
        </span>
        {lead.assignedTo && <span className="text-slate-500">{lead.assignedTo.name}</span>}
      </div>

      {followUp.note && <p className="mt-2 text-sm text-slate-700">{followUp.note}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onComplete(followUp)}
          disabled={isWorking}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Mark complete
        </button>
        <button
          type="button"
          onClick={() => onReschedule(followUp)}
          disabled={isWorking}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Reschedule
        </button>
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Call
          </a>
        )}
        <button
          type="button"
          onClick={() => onDelete(followUp)}
          disabled={isWorking}
          aria-label="Delete follow-up"
          className="ml-auto rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )
}
