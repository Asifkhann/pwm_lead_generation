import { apiClient } from './client'
import type { User, UserPayload } from '../types/user'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get<ApiEnvelope<User[]>>('/users')
  return data.data
}

export async function createUser(payload: UserPayload): Promise<User> {
  const { data } = await apiClient.post<ApiEnvelope<User>>('/users', payload)
  return data.data
}

export async function updateUser(id: string, payload: Partial<UserPayload>): Promise<User> {
  const { data } = await apiClient.put<ApiEnvelope<User>>(`/users/${id}`, payload)
  return data.data
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}
