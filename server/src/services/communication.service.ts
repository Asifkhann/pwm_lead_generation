import { isValidObjectId, Types } from 'mongoose'
import {
  CommunicationModel,
  type Communication,
  type CommunicationDocument,
} from '../models/Communication.js'
import { LeadModel } from '../models/Lead.js'
import { FollowUpModel } from '../models/FollowUp.js'
import { syncLeadNextFollowUp } from './followUp.service.js'
import { ApiError } from '../utils/ApiError.js'

function assertValidId(id: string, label: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest(`Invalid ${label} id`)
}

async function assertLeadExists(leadId: string): Promise<void> {
  assertValidId(leadId, 'lead')
  const exists = await LeadModel.exists({ _id: leadId })
  if (!exists) throw ApiError.notFound('Lead not found')
}

export async function listCommunications(leadId: string) {
  await assertLeadExists(leadId)
  return CommunicationModel.find({ lead: leadId })
    .sort({ occurredAt: -1, createdAt: -1 })
    .populate('createdBy', 'name')
}

/** The lead's last contact date is always its most recent communication. */
async function syncLastContacted(leadId: Types.ObjectId | string): Promise<void> {
  const latest = await CommunicationModel.findOne({ lead: leadId }).sort({ occurredAt: -1 })
  await LeadModel.findByIdAndUpdate(leadId, { lastContactedAt: latest?.occurredAt ?? null })
}

/**
 * A follow-up agreed during a conversation becomes a real follow-up record,
 * linked back to it, so editing the conversation updates the same follow-up
 * instead of leaving duplicates behind.
 */
async function syncLinkedFollowUp(communication: CommunicationDocument): Promise<void> {
  const existing = await FollowUpModel.findOne({ communication: communication._id })

  if (!communication.followUpDate) {
    // The date was removed; drop the follow-up unless it is already dealt with.
    if (existing && existing.status === 'pending') await existing.deleteOne()
    return
  }

  if (existing) {
    existing.dueDate = communication.followUpDate
    if (communication.nextAction) existing.note = communication.nextAction
    await existing.save()
    return
  }

  await FollowUpModel.create({
    lead: communication.lead,
    dueDate: communication.followUpDate,
    note: communication.nextAction,
    communication: communication._id,
    // The follow-up belongs to whoever had the conversation.
    createdBy: communication.createdBy,
  })
}

async function syncLeadAfterChange(communication: CommunicationDocument | null, leadId: Types.ObjectId | string): Promise<void> {
  if (communication) await syncLinkedFollowUp(communication)
  await syncLastContacted(leadId)
  await syncLeadNextFollowUp(leadId)
}

export async function createCommunication(
  leadId: string,
  payload: Partial<Communication>,
  createdBy?: string,
) {
  await assertLeadExists(leadId)

  const communication = await CommunicationModel.create({
    ...payload,
    lead: new Types.ObjectId(leadId),
    ...(createdBy ? { createdBy: new Types.ObjectId(createdBy) } : {}),
  })

  await syncLeadAfterChange(communication, leadId)
  return communication.populate('createdBy', 'name')
}

export async function updateCommunication(id: string, payload: Partial<Communication>) {
  assertValidId(id, 'communication')

  // "lead" and "createdBy" are never reassigned from the client.
  const { lead: _lead, createdBy: _createdBy, ...safePayload } = payload
  const communication = await CommunicationModel.findByIdAndUpdate(id, safePayload, {
    returnDocument: 'after',
    runValidators: true,
  })
  if (!communication) throw ApiError.notFound('Communication not found')

  await syncLeadAfterChange(communication, communication.lead)
  return communication.populate('createdBy', 'name')
}

export async function deleteCommunication(id: string) {
  assertValidId(id, 'communication')

  const communication = await CommunicationModel.findByIdAndDelete(id)
  if (!communication) throw ApiError.notFound('Communication not found')

  // A follow-up nobody has acted on yet goes with the conversation it came from.
  await FollowUpModel.deleteOne({ communication: communication._id, status: 'pending' })
  await syncLeadAfterChange(null, communication.lead)
  return communication
}

/** Called when a lead is removed so its history does not linger. */
export async function deleteCommunicationsForLead(leadId: string): Promise<number> {
  const result = await CommunicationModel.deleteMany({ lead: leadId })
  return result.deletedCount ?? 0
}
