import type { Request, Response } from 'express'
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from '../constants/lead.js'
import * as leadService from '../services/lead.service.js'
import { SORTABLE_FIELDS } from '../services/lead.service.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { getEnum, getInt, getRouteParam, getString } from '../utils/queryParams.js'
import { pickLeadFields } from '../validators/lead.validator.js'

export async function listLeads(req: Request, res: Response): Promise<void> {
  const result = await leadService.listLeads({
    page: getInt(req.query.page, 1, 1, 100_000),
    limit: getInt(req.query.limit, 20, 1, 100),
    search: getString(req.query.search),
    status: getEnum(req.query.status, LEAD_STATUSES),
    priority: getEnum(req.query.priority, LEAD_PRIORITIES),
    industry: getString(req.query.industry),
    leadSource: getEnum(req.query.leadSource, LEAD_SOURCES),
    assignedTo: getString(req.query.assignedTo),
    sortBy: getEnum(req.query.sortBy, SORTABLE_FIELDS) ?? 'createdAt',
    sortOrder: getEnum(req.query.sortOrder, ['asc', 'desc'] as const) ?? 'desc',
  })

  sendSuccess(res, result)
}

export async function checkDuplicates(req: Request, res: Response): Promise<void> {
  const duplicates = await leadService.findDuplicateLeads({
    companyName: getString(req.query.companyName),
    phone: getString(req.query.phone),
    email: getString(req.query.email),
    excludeId: getString(req.query.excludeId),
  })
  sendSuccess(res, duplicates)
}

export async function getFilterOptions(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await leadService.getFilterOptions())
}

export async function getLead(req: Request, res: Response): Promise<void> {
  const lead = await leadService.getLeadById(getRouteParam(req.params.id, 'id'))
  sendSuccess(res, lead)
}

export async function createLead(req: Request, res: Response): Promise<void> {
  const initialNote =
    typeof (req.body as { notes?: unknown })?.notes === 'string'
      ? ((req.body as { notes: string }).notes)
      : undefined

  const lead = await leadService.createLead(pickLeadFields(req.body), req.user?.id, initialNote)
  sendSuccess(res, lead, 201)
}

export async function updateLead(req: Request, res: Response): Promise<void> {
  const lead = await leadService.updateLead(getRouteParam(req.params.id, 'id'), pickLeadFields(req.body))
  sendSuccess(res, lead)
}

export async function deleteLead(req: Request, res: Response): Promise<void> {
  await leadService.deleteLead(getRouteParam(req.params.id, 'id'))
  sendSuccess(res, { deleted: true })
}
