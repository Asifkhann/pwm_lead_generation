import { apiClient } from './client'

export interface HealthResponse {
  success: true
  data: {
    status: 'ok'
    uptime: number
    timestamp: string
    environment: string
    database: {
      status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'unknown'
      name: string | null
    }
  }
}

export async function fetchHealth(): Promise<HealthResponse['data']> {
  const { data } = await apiClient.get<HealthResponse>('/health')
  return data.data
}
