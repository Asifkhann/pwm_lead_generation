import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { ApiError } from '../utils/ApiError.js'
import { isProduction } from '../config/env.js'

interface ErrorBody {
  success: false
  message: string
  details?: unknown
  stack?: string
}

/** Turns Mongoose failures into 400s with per-field messages. */
function normalise(error: unknown): { statusCode: number; message: string; details?: unknown } {
  if (error instanceof ApiError) {
    return { statusCode: error.statusCode, message: error.message, details: error.details }
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details: Record<string, string> = {}
    for (const [field, issue] of Object.entries(error.errors)) {
      details[field] = issue.message
    }
    return { statusCode: 400, message: 'Validation failed', details }
  }

  if (error instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: `Invalid value for "${error.path}"` }
  }

  const message =
    error instanceof Error && !isProduction ? error.message : 'Internal server error'
  return { statusCode: 500, message }
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const { statusCode, message, details } = normalise(error)

  if (statusCode >= 500) console.error('[error]', error)

  const body: ErrorBody = { success: false, message }
  if (details !== undefined) body.details = details
  if (!isProduction && error instanceof Error && error.stack) body.stack = error.stack

  res.status(statusCode).json(body)
}
