import type { NextFunction, Request, Response } from 'express'
import { UserModel, type UserDocument } from '../models/User.js'
import { roleHasPermission, type Permission } from '../constants/role.js'
import { SESSION_COOKIE, verifySession } from '../utils/token.js'
import { ApiError } from '../utils/ApiError.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserDocument
  }
}

/** Rejects the request unless a valid session cookie maps to an active user. */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE]
  if (!token) return next(new ApiError(401, 'You need to sign in'))

  const session = verifySession(token)
  if (!session) return next(new ApiError(401, 'Your session has expired'))

  const user = await UserModel.findById(session.sub)
  if (!user || !user.isActive) return next(new ApiError(401, 'Your account is no longer active'))

  // A password change invalidates tokens issued before it.
  const validFrom = user.sessionsValidFrom?.getTime() ?? 0
  if (session.iat !== undefined && session.iat * 1000 < validFrom - 1000) {
    return next(new ApiError(401, 'Your password changed. Please sign in again.'))
  }

  req.user = user
  next()
}

/** Use after requireAuth. Checks the permission, not the role name. */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new ApiError(401, 'You need to sign in'))
    if (!roleHasPermission(req.user.role, permission)) {
      return next(new ApiError(403, 'You do not have permission to do that'))
    }
    next()
  }
}
