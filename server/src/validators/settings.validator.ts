import type { Settings } from '../models/Settings.js'
import { ApiError } from '../utils/ApiError.js'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whitelists settings fields; ranges and enums are left to Mongoose. */
export function pickSettingsFields(body: unknown): Partial<Settings> {
  if (!isPlainObject(body)) throw ApiError.badRequest('Request body must be an object')

  const payload: Record<string, unknown> = {}

  for (const field of ['organisationName', 'defaultCurrency'] as const) {
    if (body[field] === undefined) continue
    if (typeof body[field] !== 'string') throw ApiError.badRequest(`"${field}" must be a string`)
    payload[field] = (body[field] as string).trim()
  }

  for (const field of ['upcomingFollowUpDays', 'leadsPerPage'] as const) {
    if (body[field] === undefined) continue
    const amount = Number(body[field])
    if (!Number.isInteger(amount)) {
      throw ApiError.badRequest('Validation failed', { [field]: 'Enter a whole number' })
    }
    payload[field] = amount
  }

  return payload as Partial<Settings>
}
