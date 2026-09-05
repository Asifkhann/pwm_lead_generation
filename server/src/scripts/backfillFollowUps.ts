/**
 * One-off migration: leads created before follow-ups became their own
 * collection carry a nextFollowUpAt date with no matching record. This creates
 * a pending follow-up for each of them, then re-derives every lead's date.
 *
 * Safe to run more than once — leads that already have a pending follow-up are
 * skipped.
 *
 * Usage: npm run backfill:follow-ups
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { LeadModel } from '../models/Lead.js'
import { FollowUpModel } from '../models/FollowUp.js'

async function run() {
  await connectDatabase()

  const leads = await LeadModel.find({ nextFollowUpAt: { $ne: null } }).select('_id nextFollowUpAt')
  console.log(`[backfill] ${leads.length} lead(s) with a follow-up date`)

  let created = 0
  let skipped = 0

  for (const lead of leads) {
    const dueDate = lead.nextFollowUpAt
    if (!dueDate) continue

    const existing = await FollowUpModel.exists({ lead: lead._id, status: 'pending' })
    if (existing) {
      skipped += 1
      continue
    }

    await FollowUpModel.create({
      lead: lead._id,
      dueDate,
      note: 'Imported from the lead record.',
    })
    created += 1
  }

  console.log(`[backfill] created ${created}, skipped ${skipped} (already had one)`)

  // Any lead whose date no longer matches a pending follow-up is cleared.
  const stale = await LeadModel.find({ nextFollowUpAt: { $ne: null } }).select('_id')
  let cleared = 0
  for (const lead of stale) {
    const next = await FollowUpModel.findOne({ lead: lead._id, status: 'pending' }).sort({
      dueDate: 1,
    })
    if (!next) {
      await LeadModel.findByIdAndUpdate(lead._id, { nextFollowUpAt: null })
      cleared += 1
    } else {
      await LeadModel.findByIdAndUpdate(lead._id, { nextFollowUpAt: next.dueDate })
    }
  }
  console.log(`[backfill] cleared ${cleared} lead date(s) with no pending follow-up`)

  await disconnectDatabase()
}

run().catch((error) => {
  console.error('[backfill] failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
