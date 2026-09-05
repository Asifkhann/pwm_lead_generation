import { isValidObjectId, Types } from 'mongoose'
import type { Lead } from '../models/Lead.js'
import { ApiError } from '../utils/ApiError.js'

const STRING_FIELDS = [
  'companyName',
  'businessType',
  'industry',
  'website',
  'address',
  'city',
  'country',
  'ownerName',
  'contactPerson',
  'phone',
  'email',
  'leadSource',
  'status',
  'priority',
  'currency',
] as const

const ARRAY_FIELDS = ['servicesRequired', 'problemsFound', 'opportunities'] as const
const DATE_FIELDS = ['lastContactedAt', 'nextFollowUpAt'] as const
const SOCIAL_FIELDS = ['facebook', 'instagram', 'linkedin', 'other'] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Keeps only strings, so a list of tags never contains objects. */
function toStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw ApiError.badRequest(`"${field}" must be an array of strings`)
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
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

/**
 * Whitelists incoming fields so clients cannot set arbitrary document
 * properties. Enum and required-field validation is left to Mongoose.
 */
export function pickLeadFields(body: unknown): Partial<Lead> {
  if (!isPlainObject(body)) throw ApiError.badRequest('Request body must be an object')

  const payload: Record<string, unknown> = {}

  for (const field of STRING_FIELDS) {
    if (body[field] === undefined) continue
    if (typeof body[field] !== 'string') throw ApiError.badRequest(`"${field}" must be a string`)
    payload[field] = (body[field] as string).trim()
  }

  for (const field of ARRAY_FIELDS) {
    if (body[field] === undefined) continue
    payload[field] = toStringArray(body[field], field)
  }

  for (const field of DATE_FIELDS) {
    if (body[field] === undefined) continue
    payload[field] = toDate(body[field], field)
  }

  // An empty value clears the deal value rather than storing 0.
  if (body.dealValue !== undefined) {
    if (body.dealValue === null || body.dealValue === '') {
      payload.dealValue = null
    } else {
      const amount = typeof body.dealValue === 'number' ? body.dealValue : Number(body.dealValue)
      if (!Number.isFinite(amount) || amount < 0) {
        throw ApiError.badRequest('Validation failed', {
          dealValue: 'Enter an amount of zero or more',
        })
      }
      payload.dealValue = amount
    }
  }

  // An empty string means "unassign".
  if (body.assignedTo !== undefined) {
    if (body.assignedTo === null || body.assignedTo === '') {
      payload.assignedTo = null
    } else if (typeof body.assignedTo !== 'string' || !isValidObjectId(body.assignedTo)) {
      throw ApiError.badRequest('Validation failed', { assignedTo: 'Choose a valid manager' })
    } else {
      payload.assignedTo = new Types.ObjectId(body.assignedTo)
    }
  }

  if (body.socialMedia !== undefined) {
    if (!isPlainObject(body.socialMedia)) throw ApiError.badRequest('"socialMedia" must be an object')
    const social: Record<string, string> = {}
    for (const field of SOCIAL_FIELDS) {
      const value = body.socialMedia[field]
      if (value === undefined) continue
      if (typeof value !== 'string') throw ApiError.badRequest(`"socialMedia.${field}" must be a string`)
      social[field] = value.trim()
    }
    payload.socialMedia = social
  }

  return payload as Partial<Lead>
}
