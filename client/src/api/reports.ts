import { apiClient } from './client'
import type { ReportSummary } from '../types/report'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function fetchReports(from: string, to: string): Promise<ReportSummary> {
  const { data } = await apiClient.get<ApiEnvelope<ReportSummary>>('/reports', {
    params: { from, to },
  })
  return data.data
}
