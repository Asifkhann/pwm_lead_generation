import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLeads } from '../../api/leads'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { controlClass } from '../form/controlClass'
import type { Lead } from '../../types/lead'

interface LeadPickerProps {
  selected: Lead | null
  error?: string
  onSelect: (lead: Lead | null) => void
}

/** Search-as-you-type lead chooser; a plain dropdown would not scale. */
export default function LeadPicker({ selected, error, onSelect }: LeadPickerProps) {
  const [term, setTerm] = useState('')
  const search = useDebouncedValue(term, 300)

  const results = useQuery({
    queryKey: ['leadPicker', search],
    queryFn: () =>
      fetchLeads({
        page: 1,
        limit: 8,
        search,
        status: '',
        priority: '',
        industry: '',
        leadSource: '',
        assignedTo: '',
        sortBy: 'companyName',
        sortOrder: 'asc',
      }),
    enabled: !selected && search.trim().length > 1,
  })

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{selected.companyName}</p>
          <p className="truncate text-xs text-slate-500">
            {[selected.city, selected.contactPerson, selected.phone].filter(Boolean).join(' · ') ||
              'No contact details'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null)
            setTerm('')
          }}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div>
      <input
        id="followUpLead"
        type="search"
        autoFocus
        value={term}
        placeholder="Type a company name…"
        onChange={(event) => setTerm(event.target.value)}
        className={controlClass(Boolean(error))}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {search.trim().length > 1 && (
        <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-200">
          {results.isPending && <p className="px-3 py-2 text-sm text-slate-500">Searching…</p>}

          {results.data?.items.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-500">No leads match “{search}”.</p>
          )}

          {results.data?.items.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => onSelect(lead)}
              className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-slate-50"
            >
              <span className="block text-sm font-medium text-slate-900">{lead.companyName}</span>
              <span className="block text-xs text-slate-500">
                {[lead.city, lead.assignedTo?.name].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
