import type { User } from '../models/User.js'
import { ROLES } from '../constants/role.js'
import { ApiError } from '../utils/ApiError.js'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whitelists user fields; enum and format checks are left to Mongoose. */
export function pickUserFields(
  body: unknown,
): Partial<User> & { password?: string } {
  if (!isPlainObject(body)) throw ApiError.badRequest('Request body must be an object')

  const payload: Record<string, unknown> = {}

  for (const field of ['name', 'email', 'role', 'password'] as const) {
    if (body[field] === undefined) continue
    if (typeof body[field] !== 'string') throw ApiError.badRequest(`"${field}" must be a string`)
    payload[field] = (body[field] as string).trim()
  }

  if (payload.role !== undefined && !ROLES.includes(payload.role as (typeof ROLES)[number])) {
    throw ApiError.badRequest('Validation failed', { role: 'Choose a valid role' })
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') throw ApiError.badRequest('"isActive" must be a boolean')
    payload.isActive = body.isActive
  }

  return payload as Partial<User> & { password?: string }
}

export function pickCredentials(body: unknown): { email: string; password: string } {
  if (!isPlainObject(body)) throw ApiError.badRequest('Request body must be an object')

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    throw ApiError.badRequest('Validation failed', {
      ...(email ? {} : { email: 'Email is required' }),
      ...(password ? {} : { password: 'Password is required' }),
    })
  }

  return { email, password }
}

export function pickPasswordChange(body: unknown): {
  currentPassword: string
  newPassword: string
} {
  if (!isPlainObject(body)) throw ApiError.badRequest('Request body must be an object')

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Validation failed', {
      ...(currentPassword ? {} : { currentPassword: 'Enter your current password' }),
      ...(newPassword ? {} : { newPassword: 'Enter a new password' }),
    })
  }

  return { currentPassword, newPassword }
}
