import type { Request, Response } from 'express'
import { getDatabaseStatus } from '../config/database.js'
import { env } from '../config/env.js'
import { sendSuccess } from '../utils/apiResponse.js'

export function getHealth(_req: Request, res: Response): void {
  sendSuccess(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    database: getDatabaseStatus(),
  })
}
