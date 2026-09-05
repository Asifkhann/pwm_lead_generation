/**
 * One-off migration for leads created before status changes were dated.
 *
 * - Moves the old wonAt / lostAt fields into statusTimestamps.
 * - Stamps statusTimestamps.new from createdAt.
 * - Stamps the lead's current status from updatedAt, as the best available
 *   estimate of when it got there.
 *
 * Safe to run more than once — existing stamps are never overwritten.
 *
 * Usage: npm run backfill:status-timestamps
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { LeadModel } from '../models/Lead.js'

async function run() {
  await connectDatabase()

  const leads = await LeadModel.find().select('status createdAt updatedAt statusTimestamps').lean()
  console.log(`[backfill] ${leads.length} lead(s)`)

  let updated = 0

  for (const lead of leads) {
    const raw = lead as unknown as {
      _id: unknown
      status: string
      createdAt: Date
      updatedAt: Date
      wonAt?: Date | null
      lostAt?: Date | null
      statusTimestamps?: Record<string, Date | null>
    }

    const stamps: Record<string, Date | null> = { ...(raw.statusTimestamps ?? {}) }
    const before = JSON.stringify(stamps)

    if (!stamps.new) stamps.new = raw.createdAt
    if (raw.wonAt && !stamps.won) stamps.won = raw.wonAt
    if (raw.lostAt && !stamps.lost) stamps.lost = raw.lostAt
    if (raw.status !== 'new' && !stamps[raw.status]) stamps[raw.status] = raw.updatedAt

    if (JSON.stringify(stamps) === before) continue

    // strict:false so the retired wonAt/lostAt paths are actually unset —
    // Mongoose drops update paths that are no longer in the schema.
    await LeadModel.updateOne(
      { _id: raw._id },
      { $set: { statusTimestamps: stamps }, $unset: { wonAt: '', lostAt: '' } },
      { strict: false },
    )
    updated += 1
  }

  console.log(`[backfill] stamped ${updated} lead(s)`)
  await disconnectDatabase()
}

run().catch((error) => {
  console.error('[backfill] failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
