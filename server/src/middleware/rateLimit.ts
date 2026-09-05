import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../utils/ApiError.js'

interface Attempt {
  count: number
  firstAt: number
}

/**
 * Throttles FAILED sign-in attempts, so password guessing is limited while
 * people signing in normally are never locked out. Per process — behind
 * several instances, move this to a shared store.
 */
export function rateLimit({
  windowMs,
  max,
  message,
}: {
  windowMs: number
  max: number
  message: string
}) {
  const attempts = new Map<string, Attempt>()

  // Drop stale entries so the map cannot grow without bound.
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, attempt] of attempts) {
      if (now - attempt.firstAt > windowMs) attempts.delete(key)
    }
  }, windowMs)
  timer.unref()

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown'
    const now = Date.now()
    const attempt = attempts.get(key)
    const failures = attempt && now - attempt.firstAt <= windowMs ? attempt.count : 0

    if (failures >= max) return next(new ApiError(429, message))

    // Only a rejected attempt counts against the budget.
    res.on('finish', () => {
      if (res.statusCode < 400) {
        attempts.delete(key)
        return
      }
      const current = attempts.get(key)
      if (!current || now - current.firstAt > windowMs) {
        attempts.set(key, { count: 1, firstAt: now })
      } else {
        current.count += 1
      }
    })

    next()
  }
}
