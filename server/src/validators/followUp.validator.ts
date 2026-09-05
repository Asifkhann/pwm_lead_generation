import type { FollowUp } from '../models/FollowUp.js'
import { ApiError } from '../utils/ApiError.js'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whitelists the two fields a client is allowed to set on a follow-up. */
export function pickFollowUpFields(body: unknown): Partial<FollowUp> {
  if (!isPlainObject(body)) throw ApiError.badRequest('Request body must be an object')

  const payload: Record<string, unknown> = {}

  if (body.dueDate !== undefined) {
    if (typeof body.dueDate !== 'string' && !(body.dueDate instanceof Date)) {
      throw ApiError.badRequest('"dueDate" must be a date')
    }
    const date = new Date(body.dueDate as string)
    if (Number.isNaN(date.getTime())) throw ApiError.badRequest('"dueDate" is not a valid date')
    payload.dueDate = date
  }

  if (body.note !== undefined) {
    if (typeof body.note !== 'string') throw ApiError.badRequest('"note" must be a string')
    payload.note = body.note.trim()
  }

  return payload as Partial<FollowUp>
}
