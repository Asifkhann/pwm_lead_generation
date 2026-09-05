import type { Request, Response } from 'express'
import { getActivitySummary } from '../services/activity.service.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { getString } from '../utils/queryParams.js'
import { ApiError } from '../utils/ApiError.js'

const MAX_RANGE_DAYS = 366

function parseDate(value: string | undefined, field: string): Date | undefined {
  if (value === undefined) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw ApiError.badRequest(`"${field}" is not a valid date`)
  return date
}

export async function getActivity(req: Request, res: Response): Promise<void> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(endOfToday.getDate() + 1)

  const from = parseDate(getString(req.query.from), 'from') ?? startOfToday
  const to = parseDate(getString(req.query.to), 'to') ?? endOfToday

  if (to <= from) throw ApiError.badRequest('"to" must be after "from"')
  if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_RANGE_DAYS) {
    throw ApiError.badRequest(`Date range cannot exceed ${MAX_RANGE_DAYS} days`)
  }

  sendSuccess(res, await getActivitySummary({ from, to }))
}
