import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import type { Lead, LeadSortField, SortOrder } from '../../types/lead'
import { LEAD_SOURCE_LABELS } from '../../constants/lead'
import { PriorityBadge, StatusBadge } from '../Badge'
import WebsiteLink from './WebsiteLink'
import LeadExpandedDetails from './LeadExpandedDetails'
import { ChevronDownIcon } from '../Icons'
import { formatDate, formatMoney } from '../../utils/format'

interface LeadsTableProps {
  leads: Lead[]
  sortBy: LeadSortField
  sortOrder: SortOrder
  onSort: (field: LeadSortField) => void
  expandedId: string | null
  onToggleExpand: (id: string) => void
}

interface Column {
  key: string
  label: string
  sortField?: LeadSortField
}

const columns: Column[] = [
  { key: 'expand', label: '' },
  { key: 'company', label: 'Company', sortField: 'companyName' },
  { key: 'contact', label: 'Contact' },
  { key: 'industry', label: 'Industry' },
  { key: 'value', label: 'Value', sortField: 'dealValue' },
  { key: 'status', label: 'Status', sortField: 'status' },
  { key: 'priority', label: 'Priority', sortField: 'priority' },
  { key: 'lastContact', label: 'Last Contact', sortField: 'lastContactedAt' },
  { key: 'nextFollowUp', label: 'Next Follow-up', sortField: 'nextFollowUpAt' },
  { key: 'manager', label: 'Manager' },
  { key: 'actions', label: '' },
]

function SortArrow({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) return <span className="text-slate-300">↕</span>
  return <span className="text-slate-700">{order === 'asc' ? '↑' : '↓'}</span>
}

export default function LeadsTable({
  leads,
  sortBy,
  sortOrder,
  onSort,
  expandedId,
  onToggleExpand,
}: LeadsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[62rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((column) => {
              const isActive = column.sortField === sortBy
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    isActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase"
                >
                  {column.sortField ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortField as LeadSortField)}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900"
                    >
                      {column.label}
                      <SortArrow active={isActive} order={sortOrder} />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {leads.map((lead) => {
            const isExpanded = expandedId === lead.id
            return (
              <Fragment key={lead.id}>
                <tr
                  onClick={() => onToggleExpand(lead.id)}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                    isExpanded ? 'bg-slate-50' : ''
                  }`}
                >
                  <td className="w-10 pl-4">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={`lead-details-${lead.id}`}
                      aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${lead.companyName}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleExpand(lead.id)
                      }}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    >
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </td>
                  <td className="max-w-[18rem] px-4 py-3">
                    <Link
                      to={`/leads/${lead.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {lead.companyName}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {[lead.city, LEAD_SOURCE_LABELS[lead.leadSource]].filter(Boolean).join(' · ')}
                    </p>
                    <div className="mt-0.5 flex text-xs" onClick={(event) => event.stopPropagation()}>
                      <WebsiteLink website={lead.website} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{lead.contactPerson || lead.ownerName || '—'}</p>
                    <p className="text-xs text-slate-500">{lead.phone || lead.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{lead.industry || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-slate-700">
                    {formatMoney(lead.dealValue, lead.currency, { compact: true })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={lead.priority} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {formatDate(lead.lastContactedAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {formatDate(lead.nextFollowUpAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{lead.assignedTo?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/leads/${lead.id}/edit`}
                      onClick={(event) => event.stopPropagation()}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>

                {isExpanded && (
                  <tr id={`lead-details-${lead.id}`} className="border-b border-slate-100">
                    <td colSpan={columns.length} className="px-4 pt-0 pb-4">
                      <LeadExpandedDetails lead={lead} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
