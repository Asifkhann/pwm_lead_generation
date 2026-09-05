import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchLeadFilterOptions, fetchLeads } from '../api/leads'
import { getApiErrorMessage } from '../api/client'
import { useLeadListParams } from '../hooks/useLeadListParams'
import type { LeadSortField } from '../types/lead'
import PageHeader from '../components/PageHeader'
import Placeholder from '../components/Placeholder'
import Pagination from '../components/Pagination'
import LeadsFilters from '../components/leads/LeadsFilters'
import LeadsTable from '../components/leads/LeadsTable'
import LeadCardList from '../components/leads/LeadCardList'
import LeadsSkeleton from '../components/leads/LeadsSkeleton'
import { LeadsIcon, PlusIcon, SearchIcon } from '../components/Icons'

export default function LeadsPage() {
  const { params, updateParams, clearFilters, activeFilterCount } = useLeadListParams()
  // Only one lead is expanded at a time, shared by the table and card layouts.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const toggleExpanded = (id: string) => setExpandedId((current) => (current === id ? null : id))

  const leadsQuery = useQuery({
    queryKey: ['leads', params],
    queryFn: () => fetchLeads(params),
    placeholderData: keepPreviousData,
  })

  // Loaded once and reused; the option lists rarely change.
  const optionsQuery = useQuery({
    queryKey: ['leadFilterOptions'],
    queryFn: fetchLeadFilterOptions,
    staleTime: 5 * 60_000,
  })

  const handleSort = (field: LeadSortField) => {
    const isSameField = params.sortBy === field
    updateParams({
      sortBy: field,
      sortOrder: isSameField && params.sortOrder === 'desc' ? 'asc' : 'desc',
    })
  }

  const leads = leadsQuery.data?.items ?? []
  const pagination = leadsQuery.data?.pagination
  const hasFilters = activeFilterCount > 0

  return (
    <>
      <PageHeader
        title="Leads"
        description="All potential clients, their business details and current status."
        actions={
          <Link
            to="/leads/new"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" />
            Add lead
          </Link>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <LeadsFilters
          params={params}
          options={optionsQuery.data}
          activeFilterCount={activeFilterCount}
          onChange={updateParams}
          onClear={clearFilters}
        />

        {leadsQuery.isPending && <LeadsSkeleton />}

        {leadsQuery.isError && (
          <div className="px-4 py-14 text-center sm:px-6">
            <p className="text-sm font-semibold text-slate-900">Could not load leads</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {getApiErrorMessage(leadsQuery.error)}
            </p>
            <button
              type="button"
              onClick={() => void leadsQuery.refetch()}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        )}

        {leadsQuery.data && leads.length === 0 && (
          <div className="p-4 sm:p-6">
            {hasFilters ? (
              <Placeholder
                icon={SearchIcon}
                title="No leads match these filters"
                description="Try a different search term, or clear the filters to see every lead."
              >
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              </Placeholder>
            ) : (
              <Placeholder
                icon={LeadsIcon}
                title="No leads yet"
                description="Once you start adding potential clients they will appear here with their status and follow-up dates."
              >
                <Link
                  to="/leads/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add your first lead
                </Link>
              </Placeholder>
            )}
          </div>
        )}

        {leads.length > 0 && (
          <>
            <div className={leadsQuery.isFetching ? 'opacity-60 transition-opacity' : undefined}>
              <div className="hidden md:block">
                <LeadsTable
                  leads={leads}
                  sortBy={params.sortBy}
                  sortOrder={params.sortOrder}
                  onSort={handleSort}
                  expandedId={expandedId}
                  onToggleExpand={toggleExpanded}
                />
              </div>
              <div className="md:hidden">
                <LeadCardList
                  leads={leads}
                  expandedId={expandedId}
                  onToggleExpand={toggleExpanded}
                />
              </div>
            </div>

            {pagination && (
              <Pagination
                pagination={pagination}
                disabled={leadsQuery.isFetching}
                onPageChange={(page) => updateParams({ page })}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}
