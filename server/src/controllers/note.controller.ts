import type { Request, Response } from 'express'
import * as noteService from '../services/note.service.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { getRouteParam } from '../utils/queryParams.js'
import { ApiError } from '../utils/ApiError.js'
import { roleHasPermission } from '../constants/role.js'

function readBody(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    throw ApiError.badRequest('Request body must be an object')
  }
  const value = (body as { body?: unknown }).body
  if (typeof value !== 'string' || !value.trim()) {
    throw ApiError.badRequest('Validation failed', { body: 'Write something first' })
  }
  return value.trim()
}

export async function listNotes(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await noteService.listNotes(getRouteParam(req.params.id, 'id')))
}

export async function createNote(req: Request, res: Response): Promise<void> {
  const note = await noteService.createNote(
    getRouteParam(req.params.id, 'id'),
    readBody(req.body),
    req.user?.id,
  )
  sendSuccess(res, note, 201)
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'You need to sign in')
  const note = await noteService.updateNote(
    getRouteParam(req.params.id, 'id'),
    readBody(req.body),
    req.user.id,
    roleHasPermission(req.user.role, 'notes:moderate'),
  )
  sendSuccess(res, note)
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'You need to sign in')
  await noteService.deleteNote(
    getRouteParam(req.params.id, 'id'),
    req.user.id,
    roleHasPermission(req.user.role, 'notes:moderate'),
  )
  sendSuccess(res, { deleted: true })
}
