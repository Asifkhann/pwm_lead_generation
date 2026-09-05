import { apiClient } from './client'
import type {
  Lead,
  LeadFilterOptions,
  LeadFormValues,
  LeadListParams,
  LeadListResponse,
  LeadPatch,
  DuplicateLead,
} from '../types/lead'

interface ApiEnvelope<T> {
  success: true
  data: T
}

/** Drops empty values so the request URL stays clean. */
function toQuery(params: LeadListParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  }
  if (params.search) query.search = params.search
  if (params.status) query.status = params.status
  if (params.priority) query.priority = params.priority
  if (params.industry) query.industry = params.industry
  if (params.leadSource) query.leadSource = params.leadSource
  if (params.assignedTo) query.assignedTo = params.assignedTo
  return query
}

export async function fetchLeads(params: LeadListParams): Promise<LeadListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<LeadListResponse>>('/leads', {
    params: toQuery(params),
  })
  return data.data
}

export async function fetchLeadFilterOptions(): Promise<LeadFilterOptions> {
  const { data } = await apiClient.get<ApiEnvelope<LeadFilterOptions>>('/leads/filter-options')
  return data.data
}

export async function fetchLead(id: string): Promise<Lead> {
  const { data } = await apiClient.get<ApiEnvelope<Lead>>(`/leads/${id}`)
  return data.data
}

export async function createLead(payload: LeadFormValues): Promise<Lead> {
  const { data } = await apiClient.post<ApiEnvelope<Lead>>('/leads', payload)
  return data.data
}

export async function updateLead(id: string, payload: LeadFormValues): Promise<Lead> {
  const { data } = await apiClient.put<ApiEnvelope<Lead>>(`/leads/${id}`, payload)
  return data.data
}

/** Partial update used by the detail page; the API accepts a partial body. */
export async function patchLead(id: string, patch: LeadPatch): Promise<Lead> {
  const { data } = await apiClient.put<ApiEnvelope<Lead>>(`/leads/${id}`, patch)
  return data.data
}

export interface DuplicateCheck {
  companyName?: string
  phone?: string
  email?: string
  excludeId?: string
}

export async function fetchDuplicateLeads(check: DuplicateCheck): Promise<DuplicateLead[]> {
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(check)) {
    if (value) params[key] = value
  }
  if (!params.companyName && !params.phone && !params.email) return []

  const { data } = await apiClient.get<ApiEnvelope<DuplicateLead[]>>('/leads/check-duplicates', {
    params,
  })
  return data.data
}

export async function deleteLead(id: string): Promise<void> {
  await apiClient.delete(`/leads/${id}`)
}
