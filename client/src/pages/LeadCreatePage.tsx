import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createLead, fetchLeadFilterOptions } from '../api/leads'
import { getApiErrorMessage, getApiFieldErrors } from '../api/client'
import type { LeadFormValues } from '../types/lead'
import { emptyLeadForm } from '../utils/leadForm'
import { useSettings } from '../hooks/useSettings'
import PageHeader from '../components/PageHeader'
import LeadForm from '../components/leads/LeadForm'

export default function LeadCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { settings } = useSettings()

  // Reused across the app, so this is usually already cached.
  const managersQuery = useQuery({
    queryKey: ['leadFilterOptions'],
    queryFn: fetchLeadFilterOptions,
    staleTime: 5 * 60_000,
  })

  const mutation = useMutation({
    mutationFn: (values: LeadFormValues) => createLead(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
      void queryClient.invalidateQueries({ queryKey: ['leadFilterOptions'] })
      navigate('/leads')
    },
  })

  return (
    <>
      <PageHeader title="Add lead" description="Capture a new potential client." />
      <LeadForm
        managers={managersQuery.data?.managers ?? []}
        showInitialNote
        initialValues={{ ...emptyLeadForm, currency: settings.defaultCurrency }}
        submitLabel="Create lead"
        isSubmitting={mutation.isPending}
        serverErrors={mutation.isError ? getApiFieldErrors(mutation.error) : undefined}
        serverMessage={mutation.isError ? getApiErrorMessage(mutation.error) : undefined}
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate('/leads')}
      />
    </>
  )
}
