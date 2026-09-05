import { isValidObjectId, Types } from 'mongoose'
import { FollowUpModel, type FollowUp } from '../models/FollowUp.js'
import { LeadModel } from '../models/Lead.js'
import { ApiError } from '../utils/ApiError.js'

/** Start and end of the local day for a given date. */
export function dayBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

function assertValidId(id: string, label: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest(`Invalid ${label} id`)
}

/**
 * The lead's nextFollowUpAt is a copy of its earliest pending follow-up, kept
 * here so the leads list can sort and filter without a join.
 */
export async function syncLeadNextFollowUp(leadId: Types.ObjectId | string): Promise<void> {
  const next = await FollowUpModel.findOne({ lead: leadId, status: 'pending' }).sort({ dueDate: 1 })
  await LeadModel.findByIdAndUpdate(leadId, { nextFollowUpAt: next?.dueDate ?? null })
}

async function assertLeadExists(leadId: string): Promise<void> {
  assertValidId(leadId, 'lead')
  const exists = await LeadModel.exists({ _id: leadId })
  if (!exists) throw ApiError.notFound('Lead not found')
}

async function findOrFail(id: string) {
  assertValidId(id, 'follow-up')
  const followUp = await FollowUpModel.findById(id)
  if (!followUp) throw ApiError.notFound('Follow-up not found')
  return followUp
}

export interface FollowUpFilters {
  /** A user id, or "unassigned". */
  assignedTo?: string
  upcomingDays: number
}

const LEAD_FIELDS =
  'companyName phone email contactPerson ownerName status priority assignedTo city'

/**
 * Pending follow-ups split into the three buckets the follow-ups page shows.
 * One round trip rather than three so the counts always agree with each other.
 */
export async function getPendingFollowUps(filters: FollowUpFilters) {
  const { start, end } = dayBounds()
  const upcomingEnd = new Date(start)
  upcomingEnd.setDate(upcomingEnd.getDate() + filters.upcomingDays + 1)

  const followUps = await FollowUpModel.find({ status: 'pending', dueDate: { $lt: upcomingEnd } })
    .sort({ dueDate: 1 })
    .populate({ path: 'lead', select: LEAD_FIELDS, populate: { path: 'assignedTo', select: 'name' } })

  // Filtering after populate keeps the manager filter on the lead, not the follow-up.
  const visible = followUps.filter((followUp) => {
    const lead = followUp.lead as unknown as { assignedTo?: { id?: string } | null } | null
    if (!lead) return false
    if (!filters.assignedTo) return true
    if (filters.assignedTo === 'unassigned') return !lead.assignedTo
    return String(lead.assignedTo?.id ?? '') === filters.assignedTo
  })

  return {
    overdue: visible.filter((item) => item.dueDate < start),
    today: visible.filter((item) => item.dueDate >= start && item.dueDate < end),
    upcoming: visible.filter((item) => item.dueDate >= end),
  }
}

export async function listFollowUpsForLead(leadId: string) {
  await assertLeadExists(leadId)
  return FollowUpModel.find({ lead: leadId }).sort({ status: 1, dueDate: 1 })
}

export async function createFollowUp(
  leadId: string,
  payload: Partial<FollowUp>,
  createdBy?: string,
) {
  await assertLeadExists(leadId)

  const followUp = await FollowUpModel.create({
    ...payload,
    lead: new Types.ObjectId(leadId),
    status: 'pending',
    completedAt: null,
    ...(createdBy ? { createdBy: new Types.ObjectId(createdBy) } : {}),
  })

  await syncLeadNextFollowUp(leadId)
  return followUp.populate({
    path: 'lead',
    select: LEAD_FIELDS,
    populate: { path: 'assignedTo', select: 'name' },
  })
}

export async function updateFollowUp(id: string, payload: Partial<FollowUp>) {
  const existing = await findOrFail(id)

  // lead, status and completedAt are only changed through their own actions.
  const {
    lead: _lead,
    status: _status,
    completedAt: _completedAt,
    createdBy: _createdBy,
    completedBy: _completedBy,
    ...safe
  } = payload
  existing.set(safe)
  await existing.save()

  await syncLeadNextFollowUp(existing.lead)
  return existing.populate('lead', LEAD_FIELDS)
}

export async function completeFollowUp(id: string, completedBy?: string) {
  const followUp = await findOrFail(id)

  followUp.status = 'completed'
  followUp.completedAt = new Date()
  if (completedBy) followUp.completedBy = new Types.ObjectId(completedBy)
  await followUp.save()

  // Completing a follow-up means the lead was contacted.
  await LeadModel.findByIdAndUpdate(followUp.lead, { lastContactedAt: followUp.completedAt })
  await syncLeadNextFollowUp(followUp.lead)
  return followUp.populate({
    path: 'lead',
    select: LEAD_FIELDS,
    populate: { path: 'assignedTo', select: 'name' },
  })
}

export async function reopenFollowUp(id: string) {
  const followUp = await findOrFail(id)

  followUp.status = 'pending'
  followUp.completedAt = null
  followUp.completedBy = null
  await followUp.save()

  await syncLeadNextFollowUp(followUp.lead)
  return followUp.populate({
    path: 'lead',
    select: LEAD_FIELDS,
    populate: { path: 'assignedTo', select: 'name' },
  })
}

export async function deleteFollowUp(id: string) {
  const followUp = await findOrFail(id)
  await followUp.deleteOne()
  await syncLeadNextFollowUp(followUp.lead)
  return followUp
}

/** Called when a lead is removed so its follow-ups do not linger. */
export async function deleteFollowUpsForLead(leadId: string): Promise<number> {
  const result = await FollowUpModel.deleteMany({ lead: leadId })
  return result.deletedCount ?? 0
}

/**
 * Closes out a lead's outstanding follow-ups. Used when a lead is won or lost:
 * chasing a closed deal is noise, and it keeps the follow-up queue honest.
 * Returns how many were cancelled.
 */
export async function cancelPendingFollowUpsForLead(leadId: Types.ObjectId | string) {
  const result = await FollowUpModel.updateMany(
    { lead: leadId, status: 'pending' },
    { $set: { status: 'cancelled' } },
  )

  if (result.modifiedCount > 0) await syncLeadNextFollowUp(leadId)
  return result.modifiedCount
}
