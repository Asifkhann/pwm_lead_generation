import { Link } from 'react-router-dom'
import type { DuplicateLead } from '../../types/lead'
import { LEAD_STATUS_LABELS } from '../../constants/lead'

/**
 * Advisory only — branches of the same company are legitimate, so this points
 * out the match and lets the manager decide.
 */
export default function DuplicateWarning({ duplicates }: { duplicates: DuplicateLead[] }) {
  if (duplicates.length === 0) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6" role="status">
      <p className="text-sm font-medium text-amber-900">
        {duplicates.length === 1
          ? 'A lead with these details already exists'
          : `${duplicates.length} leads with these details already exist`}
      </p>
      <ul className="mt-2 space-y-1">
        {duplicates.map((lead) => (
          <li key={lead.id} className="text-sm text-amber-900">
            <Link to={`/leads/${lead.id}`} className="font-medium underline underline-offset-2">
              {lead.companyName}
            </Link>
            <span className="text-amber-800">
              {' — '}
              {[
                LEAD_STATUS_LABELS[lead.status],
                lead.city,
                lead.assignedTo?.name,
                lead.phone,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-amber-800">
        You can still save this one — different branches of a business are fine.
      </p>
    </div>
  )
}
