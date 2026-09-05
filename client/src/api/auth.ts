import { apiClient } from './client'
import type { Session } from '../types/user'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function login(email: string, password: string): Promise<Session> {
  const { data } = await apiClient.post<ApiEnvelope<Session>>('/auth/login', { email, password })
  return data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchSession(): Promise<Session> {
  const { data } = await apiClient.get<ApiEnvelope<Session>>('/auth/me')
  return data.data
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword })
}
