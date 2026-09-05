import { apiClient } from './client'
import type { DashboardSummary } from '../types/dashboard'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function fetchDashboard(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<ApiEnvelope<DashboardSummary>>('/dashboard')
  return data.data
}
