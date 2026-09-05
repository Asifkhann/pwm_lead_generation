import type { Response } from 'express'

/** Every successful response uses this envelope. */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, data })
}
