import type { Communication } from '../models/Communication.js'
import { ApiError } from '../utils/ApiError.js'

const STRING_FIELDS = [
  'type',
  'contactPerson',
  'outcome',
  'discussionNotes',
  'clientRequirements',
  'clientConcerns',
  'nextAction',
] as const

const DATE_FIELDS = ['occurredAt', 'followUpDate'] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toDate(value: unknown, field: string): Date | null {
  if (value === null || value === '') return null
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw ApiError.badRequest(`"${field}" must be a date`)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw ApiError.badRequest(`"${field}" is not a valid date`)
  return date
}

/** Whitelists incoming fields; enum validation is left to Mongoose. */
export function pickCommunicationFields(body: unknown): Partial<Communication> {
  if (!isPlainObject(body)) throw ApiError.badRequest('Request body must be an object')

  const payload: Record<string, unknown> = {}

  for (const field of STRING_FIELDS) {
    if (body[field] === undefined) continue
    if (typeof body[field] !== 'string') throw ApiError.badRequest(`"${field}" must be a string`)
    payload[field] = (body[field] as string).trim()
  }

  for (const field of DATE_FIELDS) {
    if (body[field] === undefined) continue
    payload[field] = toDate(body[field], field)
  }

  if (body.servicesDiscussed !== undefined) {
    if (!Array.isArray(body.servicesDiscussed)) {
      throw ApiError.badRequest('"servicesDiscussed" must be an array of strings')
    }
    payload.servicesDiscussed = body.servicesDiscussed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return payload as Partial<Communication>
}
