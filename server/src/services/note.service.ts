import { isValidObjectId, Types } from 'mongoose'
import { NoteModel, type Note } from '../models/Note.js'
import { LeadModel } from '../models/Lead.js'
import { ApiError } from '../utils/ApiError.js'

async function assertLeadExists(leadId: string): Promise<void> {
  if (!isValidObjectId(leadId)) throw ApiError.badRequest('Invalid lead id')
  const exists = await LeadModel.exists({ _id: leadId })
  if (!exists) throw ApiError.notFound('Lead not found')
}

export async function listNotes(leadId: string) {
  await assertLeadExists(leadId)
  return NoteModel.find({ lead: leadId }).sort({ createdAt: -1 }).populate('createdBy', 'name')
}

export async function createNote(leadId: string, body: string, createdBy?: string) {
  await assertLeadExists(leadId)

  const note = await NoteModel.create({
    lead: new Types.ObjectId(leadId),
    body,
    ...(createdBy ? { createdBy: new Types.ObjectId(createdBy) } : {}),
  })
  return note.populate('createdBy', 'name')
}

async function findOrFail(id: string) {
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid note id')
  const note = await NoteModel.findById(id)
  if (!note) throw ApiError.notFound('Note not found')
  return note
}

/** You may change your own notes; an admin may change anyone's. */
function assertMayEdit(note: Note, userId: string, canModerate: boolean): void {
  if (canModerate) return
  if (note.createdBy && String(note.createdBy) === userId) return
  throw new ApiError(403, 'You can only edit notes you wrote')
}

export async function updateNote(
  id: string,
  body: string,
  userId: string,
  canModerate: boolean,
) {
  const note = await findOrFail(id)
  assertMayEdit(note, userId, canModerate)

  note.body = body
  await note.save()
  return note.populate('createdBy', 'name')
}

export async function deleteNote(id: string, userId: string, canModerate: boolean) {
  const note = await findOrFail(id)
  assertMayEdit(note, userId, canModerate)

  await note.deleteOne()
  return note
}

/** Called when a lead is removed so its notes do not linger. */
export async function deleteNotesForLead(leadId: string): Promise<number> {
  const result = await NoteModel.deleteMany({ lead: leadId })
  return result.deletedCount ?? 0
}
