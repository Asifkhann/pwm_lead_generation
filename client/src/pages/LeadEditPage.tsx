import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchLead, fetchLeadFilterOptions, updateLead } from '../api/leads'
import { getApiErrorMessage, getApiFieldErrors } from '../api/client'
import type { LeadFormValues } from '../types/lead'
import { leadToFormValues } from '../utils/leadForm'
import PageHeader from '../components/PageHeader'
import LeadForm from '../components/leads/LeadForm'

function FormSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-busy="true">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-9 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  )
}

export default function LeadEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const managersQuery = useQuery({
    queryKey: ['leadFilterOptions'],
    queryFn: fetchLeadFilterOptions,
    staleTime: 5 * 60_000,
  })

  const leadQuery = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLead(id),
    enabled: Boolean(id),
  })

  const mutation = useMutation({
    mutationFn: (values: LeadFormValues) => updateLead(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
      void queryClient.invalidateQueries({ queryKey: ['lead', id] })
      void queryClient.invalidateQueries({ queryKey: ['leadFilterOptions'] })
      navigate('/leads')
    },
  })

  if (leadQuery.isPending) {
    return (
      <>
        <PageHeader title="Edit lead" />
        <FormSkeleton />
      </>
    )
  }

  if (leadQuery.isError) {
    return (
      <>
        <PageHeader title="Edit lead" />
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Could not load this lead</p>
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
      </>
    )
  }

  return (
    <>
      <PageHeader title="Edit lead" description={leadQuery.data.companyName} />
      <LeadForm
        managers={managersQuery.data?.managers ?? []}
        leadId={id}
        initialValues={leadToFormValues(leadQuery.data)}
        submitLabel="Save changes"
        isSubmitting={mutation.isPending}
        serverErrors={mutation.isError ? getApiFieldErrors(mutation.error) : undefined}
        serverMessage={mutation.isError ? getApiErrorMessage(mutation.error) : undefined}
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate('/leads')}
      />
    </>
  )
}
