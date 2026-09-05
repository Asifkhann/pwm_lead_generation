import { apiClient } from './client'
import type { ActivitySummary } from '../types/activity'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function fetchActivity(from: string, to: string): Promise<ActivitySummary> {
  const { data } = await apiClient.get<ApiEnvelope<ActivitySummary>>('/activity', {
    params: { from, to },
  })
  return data.data
}
