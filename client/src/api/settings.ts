import { apiClient } from './client'
import type { Settings, SettingsPayload } from '../types/settings'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function fetchSettings(): Promise<Settings> {
  const { data } = await apiClient.get<ApiEnvelope<Settings>>('/settings')
  return data.data
}

export async function updateSettings(payload: SettingsPayload): Promise<Settings> {
  const { data } = await apiClient.put<ApiEnvelope<Settings>>('/settings', payload)
  return data.data
}
