import type { Request, Response } from 'express'
import * as userService from '../services/user.service.js'
import { pickUserFields } from '../validators/user.validator.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { getRouteParam } from '../utils/queryParams.js'
import { ApiError } from '../utils/ApiError.js'

export async function listUsers(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await userService.listUsers())
}

export async function createUser(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await userService.createUser(pickUserFields(req.body)), 201)
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const id = getRouteParam(req.params.id, 'id')
  const payload = pickUserFields(req.body)

  // Admins must not lock themselves out of their own account.
  if (req.user && id === req.user.id) {
    if (payload.role !== undefined && payload.role !== req.user.role) {
      throw ApiError.badRequest('You cannot change your own role')
    }
    if (payload.isActive === false) {
      throw ApiError.badRequest('You cannot deactivate your own account')
    }
  }

  sendSuccess(res, await userService.updateUser(id, payload))
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = getRouteParam(req.params.id, 'id')
  await userService.deleteUser(id, req.user?.id ?? '')
  sendSuccess(res, { deleted: true })
}
