import { apiClient } from './client'
import type { Note } from '../types/note'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function fetchNotes(leadId: string): Promise<Note[]> {
  const { data } = await apiClient.get<ApiEnvelope<Note[]>>(`/leads/${leadId}/notes`)
  return data.data
}

export async function createNote(leadId: string, body: string): Promise<Note> {
  const { data } = await apiClient.post<ApiEnvelope<Note>>(`/leads/${leadId}/notes`, { body })
  return data.data
}

export async function updateNote(id: string, body: string): Promise<Note> {
  const { data } = await apiClient.put<ApiEnvelope<Note>>(`/notes/${id}`, { body })
  return data.data
}

export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notes/${id}`)
}
