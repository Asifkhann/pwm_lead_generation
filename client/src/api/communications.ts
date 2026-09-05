import { apiClient } from './client'
import type { Communication, CommunicationPayload } from '../types/communication'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function fetchCommunications(leadId: string): Promise<Communication[]> {
  const { data } = await apiClient.get<ApiEnvelope<Communication[]>>(
    `/leads/${leadId}/communications`,
  )
  return data.data
}

export async function createCommunication(
  leadId: string,
  payload: CommunicationPayload,
): Promise<Communication> {
  const { data } = await apiClient.post<ApiEnvelope<Communication>>(
    `/leads/${leadId}/communications`,
    payload,
  )
  return data.data
}

export async function updateCommunication(
  id: string,
  payload: CommunicationPayload,
): Promise<Communication> {
  const { data } = await apiClient.put<ApiEnvelope<Communication>>(`/communications/${id}`, payload)
  return data.data
}

export async function deleteCommunication(id: string): Promise<void> {
  await apiClient.delete(`/communications/${id}`)
}
