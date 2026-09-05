import type { Request, Response } from 'express'
import * as followUpService from '../services/followUp.service.js'
import { getSettings } from '../services/settings.service.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { getInt, getRouteParam, getString } from '../utils/queryParams.js'
import { pickFollowUpFields } from '../validators/followUp.validator.js'

export async function getPendingFollowUps(req: Request, res: Response): Promise<void> {
  const settings = await getSettings()
  const result = await followUpService.getPendingFollowUps({
    assignedTo: getString(req.query.assignedTo),
    upcomingDays: getInt(req.query.upcomingDays, settings.upcomingFollowUpDays, 1, 365),
  })

  sendSuccess(res, {
    ...result,
    counts: {
      overdue: result.overdue.length,
      today: result.today.length,
      upcoming: result.upcoming.length,
    },
  })
}

export async function listFollowUpsForLead(req: Request, res: Response): Promise<void> {
  const leadId = getRouteParam(req.params.id, 'id')
  sendSuccess(res, await followUpService.listFollowUpsForLead(leadId))
}

export async function createFollowUp(req: Request, res: Response): Promise<void> {
  const leadId = getRouteParam(req.params.id, 'id')
  const followUp = await followUpService.createFollowUp(
    leadId,
    pickFollowUpFields(req.body),
    req.user?.id,
  )
  sendSuccess(res, followUp, 201)
}

export async function updateFollowUp(req: Request, res: Response): Promise<void> {
  const id = getRouteParam(req.params.id, 'id')
  sendSuccess(res, await followUpService.updateFollowUp(id, pickFollowUpFields(req.body)))
}

export async function completeFollowUp(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await followUpService.completeFollowUp(getRouteParam(req.params.id, 'id'), req.user?.id),
  )
}

export async function reopenFollowUp(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await followUpService.reopenFollowUp(getRouteParam(req.params.id, 'id')))
}

export async function deleteFollowUp(req: Request, res: Response): Promise<void> {
  await followUpService.deleteFollowUp(getRouteParam(req.params.id, 'id'))
  sendSuccess(res, { deleted: true })
}
