import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { Role } from '../constants/role.js'

export interface SessionPayload {
  sub: string
  role: Role
  /** Issued-at, in seconds, as set by jsonwebtoken. */
  iat?: number
}

export const SESSION_COOKIE = 'pwm_session'

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: `${env.sessionDays}d` })
}

/** Returns null for anything invalid or expired, so callers never throw. */
export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret)
    if (typeof decoded === 'string' || !decoded.sub) return null
    return {
      sub: String(decoded.sub),
      role: (decoded as { role: Role }).role,
      iat: decoded.iat,
    }
  } catch {
    return null
  }
}
