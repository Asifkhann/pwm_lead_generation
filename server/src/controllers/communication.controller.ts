import type { Request, Response } from 'express'
import * as communicationService from '../services/communication.service.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { getRouteParam } from '../utils/queryParams.js'
import { pickCommunicationFields } from '../validators/communication.validator.js'

export async function listCommunications(req: Request, res: Response): Promise<void> {
  const leadId = getRouteParam(req.params.id, 'id')
  sendSuccess(res, await communicationService.listCommunications(leadId))
}

export async function createCommunication(req: Request, res: Response): Promise<void> {
  const leadId = getRouteParam(req.params.id, 'id')
  const communication = await communicationService.createCommunication(
    leadId,
    pickCommunicationFields(req.body),
    req.user?.id,
  )
  sendSuccess(res, communication, 201)
}

export async function updateCommunication(req: Request, res: Response): Promise<void> {
  const id = getRouteParam(req.params.id, 'id')
  const communication = await communicationService.updateCommunication(
    id,
    pickCommunicationFields(req.body),
  )
  sendSuccess(res, communication)
}

export async function deleteCommunication(req: Request, res: Response): Promise<void> {
  await communicationService.deleteCommunication(getRouteParam(req.params.id, 'id'))
  sendSuccess(res, { deleted: true })
}
