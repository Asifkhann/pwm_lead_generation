import { Link } from 'react-router-dom'
import type { Lead } from '../../types/lead'
import { formatDateTime } from '../../utils/format'

function TagList({ values }: { values: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <li
          key={value}
          className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800 ring-1 ring-amber-600/20 ring-inset"
        >
          {value}
        </li>
      ))}
    </ul>
  )
}

/**
 * The quick-look panel shown when a lead row is expanded in the list.
 * Deliberately limited to the two things a manager checks before calling.
 */
export default function LeadExpandedDetails({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Problems Found
          </h4>
          <div className="mt-2">
            {lead.problemsFound.length > 0 ? (
              <TagList values={lead.problemsFound} />
            ) : (
              <p className="text-sm text-slate-400">No problems recorded yet.</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Latest note
          </h4>
          <div className="mt-2">
            {lead.latestNote ? (
              <>
                <p className="text-sm whitespace-pre-line text-slate-700">
                  {lead.latestNote.body}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {lead.latestNote.authorName ?? 'Unknown'} ·{' '}
                  {formatDateTime(lead.latestNote.createdAt)}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">No notes added yet.</p>
            )}
          </div>
        </div>
      </div>

      <Link
        to={`/leads/${lead.id}`}
        className="mt-4 inline-flex text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
      >
        View full details →
      </Link>
    </div>
  )
}
