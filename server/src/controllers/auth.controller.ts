import type { CookieOptions, Request, Response } from 'express'
import * as userService from '../services/user.service.js'
import { pickCredentials, pickPasswordChange } from '../validators/user.validator.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { SESSION_COOKIE, signSession } from '../utils/token.js'
import { env, isProduction } from '../config/env.js'
import { ROLE_PERMISSIONS } from '../constants/role.js'
import { ApiError } from '../utils/ApiError.js'
import type { UserDocument } from '../models/User.js'

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: env.sessionDays * 24 * 60 * 60 * 1000,
    path: '/',
  }
}

/** The shape the client stores: the user plus what that role may do. */
function sessionResponse(user: UserDocument) {
  return { user: user.toJSON(), permissions: ROLE_PERMISSIONS[user.role] }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = pickCredentials(req.body)

  const user = await userService.authenticate(email, password)
  if (!user) throw new ApiError(401, 'Email or password is incorrect')

  res.cookie(SESSION_COOKIE, signSession({ sub: user.id, role: user.role }), cookieOptions())
  sendSuccess(res, sessionResponse(user))
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined })
  sendSuccess(res, { loggedOut: true })
}

export function me(req: Request, res: Response): void {
  if (!req.user) throw new ApiError(401, 'You need to sign in')
  sendSuccess(res, sessionResponse(req.user))
}

/** Anyone may change their own password; no permission needed. */
export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'You need to sign in')

  const { currentPassword, newPassword } = pickPasswordChange(req.body)
  await userService.changeOwnPassword(req.user.id, currentPassword, newPassword)

  // Re-issue the cookie so the session keeps running after the change.
  res.cookie(SESSION_COOKIE, signSession({ sub: req.user.id, role: req.user.role }), cookieOptions())
  sendSuccess(res, { changed: true })
}
