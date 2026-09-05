import { apiClient } from './client'
import type {
  FollowUp,
  FollowUpBuckets,
  FollowUpPayload,
  LeadFollowUp,
} from '../types/followUp'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export interface FollowUpQuery {
  /** A user id, or "unassigned". */
  assignedTo?: string
  upcomingDays?: number
}

export async function fetchFollowUps(query: FollowUpQuery = {}): Promise<FollowUpBuckets> {
  const params: Record<string, string | number> = {}
  if (query.assignedTo) params.assignedTo = query.assignedTo
  if (query.upcomingDays) params.upcomingDays = query.upcomingDays

  const { data } = await apiClient.get<ApiEnvelope<FollowUpBuckets>>('/follow-ups', { params })
  return data.data
}

export async function fetchLeadFollowUps(leadId: string): Promise<LeadFollowUp[]> {
  const { data } = await apiClient.get<ApiEnvelope<LeadFollowUp[]>>(`/leads/${leadId}/follow-ups`)
  return data.data
}

export async function createFollowUp(
  leadId: string,
  payload: FollowUpPayload,
): Promise<FollowUp> {
  const { data } = await apiClient.post<ApiEnvelope<FollowUp>>(
    `/leads/${leadId}/follow-ups`,
    payload,
  )
  return data.data
}

export async function updateFollowUp(id: string, payload: FollowUpPayload): Promise<FollowUp> {
  const { data } = await apiClient.put<ApiEnvelope<FollowUp>>(`/follow-ups/${id}`, payload)
  return data.data
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  const { data } = await apiClient.post<ApiEnvelope<FollowUp>>(`/follow-ups/${id}/complete`)
  return data.data
}

export async function reopenFollowUp(id: string): Promise<FollowUp> {
  const { data } = await apiClient.post<ApiEnvelope<FollowUp>>(`/follow-ups/${id}/reopen`)
  return data.data
}

export async function deleteFollowUp(id: string): Promise<void> {
  await apiClient.delete(`/follow-ups/${id}`)
}
