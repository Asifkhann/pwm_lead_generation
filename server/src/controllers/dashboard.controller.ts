import type { Request, Response } from 'express'
import { getDashboardSummary } from '../services/dashboard.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await getDashboardSummary())
}
