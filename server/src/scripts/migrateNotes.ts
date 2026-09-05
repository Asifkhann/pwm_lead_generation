/**
 * One-off migration: notes used to be a single string on the lead. This moves
 * each lead's text into a Note record so it has an author, a date, and can be
 * edited or removed on its own.
 *
 * The lead's text is only cleared once its Note exists, and the read goes
 * through the driver because Mongoose hides fields that left the schema.
 *
 * Safe to run more than once — a lead that already has an imported note is
 * skipped.
 *
 * Usage: npm run migrate:notes
 */
import mongoose from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { NoteModel } from '../models/Note.js'

interface RawLead {
  _id: mongoose.Types.ObjectId
  companyName?: string
  notes?: string
  updatedAt?: Date
  createdAt?: Date
}

async function run() {
  await connectDatabase()

  const leads = mongoose.connection.collection<RawLead>('leads')
  const withNotes = await leads.find({ notes: { $exists: true, $ne: '' } }).toArray()

  console.log(`[notes] ${withNotes.length} lead(s) carry note text`)

  let created = 0
  let skipped = 0

  for (const lead of withNotes) {
    const body = (lead.notes ?? '').trim()
    if (!body) continue

    // Re-runnable: do not import the same text twice.
    const existing = await NoteModel.findOne({ lead: lead._id, body })
    if (existing) {
      skipped += 1
    } else {
      await NoteModel.create({
        lead: lead._id,
        body,
        createdBy: null,
        // Best available estimate of when the note was written.
        createdAt: lead.updatedAt ?? lead.createdAt ?? new Date(),
      })
      created += 1
    }

    // Only now is it safe to drop the text from the lead.
    await leads.updateOne({ _id: lead._id }, { $unset: { notes: '' } })
  }

  console.log(`[notes] created ${created} note(s), skipped ${skipped} already imported`)

  const leftover = await leads.countDocuments({ notes: { $exists: true, $ne: '' } })
  console.log(`[notes] leads still holding note text: ${leftover}`)

  await disconnectDatabase()
}

run().catch((error) => {
  console.error('[notes] failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
