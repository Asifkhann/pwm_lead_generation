import axios, { AxiosError } from 'axios'

/**
 * Shape of every error response returned by the API.
 * Mirrors the server's error handler payload.
 */
export interface ApiErrorBody {
  success: false
  message: string
  details?: unknown
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  // The session lives in an httpOnly cookie.
  withCredentials: true,
})

/** True when the API rejected the request because the session is missing or expired. */
export function isUnauthorized(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 401
}

/** True when the signed-in user lacks permission for the action. */
export function isForbidden(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 403
}

/** Normalises any thrown value into a human readable message. */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.message) return body.message
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
    if (!error.response) return 'Cannot reach the server. Is the backend running?'
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
)

/**
 * Pulls the per-field messages the API returns for a validation failure,
 * so the form can show them next to the right inputs.
 */
export function getApiFieldErrors(error: unknown): Record<string, string> | undefined {
  if (!(error instanceof AxiosError)) return undefined
  const details = (error.response?.data as ApiErrorBody | undefined)?.details
  if (typeof details !== 'object' || details === null || Array.isArray(details)) return undefined

  const fieldErrors: Record<string, string> = {}
  for (const [field, message] of Object.entries(details)) {
    if (typeof message === 'string') fieldErrors[field] = message
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
}
