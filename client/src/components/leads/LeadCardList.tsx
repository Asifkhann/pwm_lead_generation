import { Link } from 'react-router-dom'
import type { Lead } from '../../types/lead'
import { LEAD_SOURCE_LABELS } from '../../constants/lead'
import { PriorityBadge, StatusBadge } from '../Badge'
import WebsiteLink from './WebsiteLink'
import LeadExpandedDetails from './LeadExpandedDetails'
import { ChevronDownIcon } from '../Icons'
import { formatDate, formatMoney } from '../../utils/format'

interface LeadCardListProps {
  leads: Lead[]
  expandedId: string | null
  onToggleExpand: (id: string) => void
}

/** Card layout used instead of the table on small screens. */
export default function LeadCardList({ leads, expandedId, onToggleExpand }: LeadCardListProps) {
  return (
    <ul className="divide-y divide-slate-100">
      {leads.map((lead) => {
        const isExpanded = expandedId === lead.id
        return (
          <li key={lead.id} className={`px-4 py-4 ${isExpanded ? 'bg-slate-50' : ''}`}>
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-controls={`lead-card-details-${lead.id}`}
              onClick={() => onToggleExpand(lead.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onToggleExpand(lead.id)
                }
              }}
              className="flex items-start justify-between gap-3 text-left"
            >
              <div className="min-w-0">
                <Link
                  to={`/leads/${lead.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="block truncate font-medium text-slate-900 hover:underline"
                >
                  {lead.companyName}
                </Link>
                <p className="truncate text-xs text-slate-500">
                  {[lead.industry, lead.city, LEAD_SOURCE_LABELS[lead.leadSource]]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className="mt-0.5 flex text-xs" onClick={(event) => event.stopPropagation()}>
                  <WebsiteLink website={lead.website} />
                </div>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={lead.status} />
                  <PriorityBadge priority={lead.priority} />
                </div>
                <ChevronDownIcon
                  className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="col-span-2">
                <dt className="text-slate-500">Contact</dt>
                <dd className="text-slate-700">
                  {lead.contactPerson || lead.ownerName || '—'}
                  {lead.phone && <span className="text-slate-500"> · {lead.phone}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Value</dt>
                <dd className="text-slate-700">{formatMoney(lead.dealValue, lead.currency)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Last contact</dt>
                <dd className="text-slate-700">{formatDate(lead.lastContactedAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Next follow-up</dt>
                <dd className="text-slate-700">{formatDate(lead.nextFollowUpAt)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Manager</dt>
                <dd className="text-slate-700">{lead.assignedTo?.name ?? '—'}</dd>
              </div>
            </dl>

            {isExpanded && (
              <div id={`lead-card-details-${lead.id}`} className="mt-3">
                <LeadExpandedDetails lead={lead} />
              </div>
            )}

            <Link
              to={`/leads/${lead.id}/edit`}
              className="mt-3 inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
