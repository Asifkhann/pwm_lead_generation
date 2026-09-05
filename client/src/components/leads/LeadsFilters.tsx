import { useEffect, useState } from 'react'
import {
  LEAD_PRIORITIES,
  LEAD_PRIORITY_LABELS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from '../../constants/lead'
import type { LeadFilterOptions, LeadListParams, LeadSortField } from '../../types/lead'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import Select from '../Select'
import { SearchIcon } from '../Icons'

interface LeadsFiltersProps {
  params: LeadListParams
  options?: LeadFilterOptions
  activeFilterCount: number
  onChange: (changes: Partial<Record<keyof LeadListParams, string | number>>) => void
  onClear: () => void
}

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }))

const toPlainOptions = (values: string[]) => values.map((value) => ({ value, label: value }))

/** Managers come from user accounts; "unassigned" is a filter in its own right. */
const managerOptions = (options?: LeadFilterOptions) => [
  ...(options?.managers ?? []).map((user) => ({ value: user.id, label: user.name })),
  ...(options && options.unassignedCount > 0
    ? [{ value: 'unassigned', label: `Unassigned (${options.unassignedCount})` }]
    : []),
]

/** Mobile has no column headers to click, so sorting gets its own control. */
const SORT_OPTIONS: { value: `${LeadSortField}:${'asc' | 'desc'}`; label: string }[] = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'companyName:asc', label: 'Company A–Z' },
  { value: 'companyName:desc', label: 'Company Z–A' },
  { value: 'priority:desc', label: 'Priority' },
  { value: 'dealValue:desc', label: 'Largest deal' },
  { value: 'nextFollowUpAt:asc', label: 'Next follow-up' },
  { value: 'lastContactedAt:desc', label: 'Recently contacted' },
]

export default function LeadsFilters({
  params,
  options,
  activeFilterCount,
  onChange,
  onClear,
}: LeadsFiltersProps) {
  const [searchInput, setSearchInput] = useState(params.search)
  const debouncedSearch = useDebouncedValue(searchInput)

  // Keep the input in sync when filters are cleared from outside.
  useEffect(() => {
    setSearchInput(params.search)
  }, [params.search])

  useEffect(() => {
    if (debouncedSearch !== params.search) onChange({ search: debouncedSearch })
    // onChange and params.search are intentionally omitted: this effect should
    // only fire when the debounced input settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  return (
    <div className="space-y-4 border-b border-slate-200 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search company, contact, phone, email…"
            aria-label="Search leads"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Clear filters ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Select
          label="Status"
          placeholder="All statuses"
          value={params.status}
          options={toOptions(LEAD_STATUSES, LEAD_STATUS_LABELS)}
          onChange={(value) => onChange({ status: value })}
        />
        <Select
          label="Priority"
          placeholder="All priorities"
          value={params.priority}
          options={toOptions(LEAD_PRIORITIES, LEAD_PRIORITY_LABELS)}
          onChange={(value) => onChange({ priority: value })}
        />
        <Select
          label="Industry"
          placeholder="All industries"
          value={params.industry}
          options={toPlainOptions(options?.industries ?? [])}
          disabled={!options}
          onChange={(value) => onChange({ industry: value })}
        />
        <Select
          label="Source"
          placeholder="All sources"
          value={params.leadSource}
          options={toOptions(LEAD_SOURCES, LEAD_SOURCE_LABELS)}
          onChange={(value) => onChange({ leadSource: value })}
        />
        <Select
          label="Manager"
          placeholder="All managers"
          value={params.assignedTo}
          options={managerOptions(options)}
          disabled={!options}
          onChange={(value) => onChange({ assignedTo: value })}
        />

        <div className="col-span-2 md:hidden">
          <Select
            label="Sort by"
            placeholder="Newest first"
            value={`${params.sortBy}:${params.sortOrder}`}
            options={SORT_OPTIONS}
            onChange={(value) => {
              const [sortBy, sortOrder] = value.split(':')
              onChange({ sortBy: sortBy || 'createdAt', sortOrder: sortOrder || 'desc' })
            }}
          />
        </div>
      </div>
    </div>
  )
}
