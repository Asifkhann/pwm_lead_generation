import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LEAD_SORT_FIELDS, type LeadListParams, type LeadSortField } from '../types/lead'
import { useSettings } from './useSettings'

const FILTER_KEYS = ['search', 'status', 'priority', 'industry', 'leadSource', 'assignedTo'] as const

function toSortField(value: string | null): LeadSortField {
  return (LEAD_SORT_FIELDS as readonly string[]).includes(value ?? '')
    ? (value as LeadSortField)
    : 'createdAt'
}

/**
 * Keeps the list state in the URL so filters survive a refresh and can be
 * shared or bookmarked.
 */
export function useLeadListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { settings } = useSettings()
  const limit = settings.leadsPerPage

  const params = useMemo<LeadListParams>(() => {
    const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
    return {
      page: Number.isNaN(page) || page < 1 ? 1 : page,
      limit,
      search: searchParams.get('search') ?? '',
      status: searchParams.get('status') ?? '',
      priority: searchParams.get('priority') ?? '',
      industry: searchParams.get('industry') ?? '',
      leadSource: searchParams.get('leadSource') ?? '',
      assignedTo: searchParams.get('assignedTo') ?? '',
      sortBy: toSortField(searchParams.get('sortBy')),
      sortOrder: searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc',
    }
  }, [searchParams, limit])

  /** Filters reset paging; page changes do not. */
  const updateParams = useCallback(
    (changes: Partial<Record<keyof LeadListParams, string | number>>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value === '' || value === undefined) next.delete(key)
            else next.set(key, String(value))
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const key of FILTER_KEYS) next.delete(key)
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  const activeFilterCount = FILTER_KEYS.filter((key) => params[key] !== '').length

  return { params, updateParams, clearFilters, activeFilterCount }
}
