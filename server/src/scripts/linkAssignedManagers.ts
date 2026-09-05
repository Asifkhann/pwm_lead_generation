/**
 * One-off migration: leads used to store the assigned manager as free text.
 * This links each lead to the matching user account instead.
 *
 * Names are matched case-insensitively against user names and email prefixes,
 * so "zohaib" and "Zohaib" both resolve to the same person.
 *
 * The original text is copied to `legacyAssignedManager` BEFORE anything is
 * removed, so re-running after creating the missing accounts links their leads
 * too. The old field is only cleared once its value is safely stored.
 *
 * Usage: npm run link:managers
 */
import mongoose from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { UserModel } from '../models/User.js'

interface RawLead {
  _id: mongoose.Types.ObjectId
  assignedManager?: string
  legacyAssignedManager?: string
  assignedTo?: mongoose.Types.ObjectId | null
}

async function run() {
  await connectDatabase()

  const users = await UserModel.find().select('name email')
  const byName = new Map<string, (typeof users)[number]>()
  for (const user of users) {
    byName.set(user.name.trim().toLowerCase(), user)
    byName.set(user.email.split('@')[0].toLowerCase(), user)
  }

  // Read through the driver: Mongoose hides fields that left the schema.
  const collection = mongoose.connection.collection<RawLead>('leads')
  const leads = await collection.find({}).toArray()

  let linked = 0
  let alreadyLinked = 0
  let preserved = 0
  const unmatched = new Map<string, number>()

  for (const lead of leads) {
    const name = (lead.legacyAssignedManager || lead.assignedManager || '').trim()

    // Always keep a copy first, so nothing depends on the old field surviving.
    if (name && lead.legacyAssignedManager !== name) {
      await collection.updateOne({ _id: lead._id }, { $set: { legacyAssignedManager: name } })
      preserved += 1
    }

    if (lead.assignedTo) {
      alreadyLinked += 1
      continue
    }
    if (!name) continue

    const match = byName.get(name.toLowerCase())
    if (!match) {
      unmatched.set(name, (unmatched.get(name) ?? 0) + 1)
      continue
    }

    await collection.updateOne({ _id: lead._id }, { $set: { assignedTo: match._id } })
    linked += 1
  }

  console.log(`[link] ${leads.length} lead(s) examined`)
  if (preserved) console.log(`[link] preserved the manager name on ${preserved} lead(s)`)
  console.log(`[link] linked ${linked} lead(s) to a user account`)
  if (alreadyLinked) console.log(`[link] ${alreadyLinked} already linked, left alone`)

  if (unmatched.size > 0) {
    console.log('[link] no user account matches these names, so those leads stay unassigned:')
    for (const [name, count] of [...unmatched].sort((a, b) => b[1] - a[1])) {
      console.log(`         "${name}" — ${count} lead(s)`)
    }
    console.log('[link] create those users in Settings → Users, then run this again.')
  }

  // Only drop the old field where its value is definitely stored elsewhere.
  const safeToClear = await collection.countDocuments({
    assignedManager: { $exists: true },
    legacyAssignedManager: { $exists: true, $ne: '' },
  })
  if (safeToClear > 0) {
    await collection.updateMany(
      { assignedManager: { $exists: true }, legacyAssignedManager: { $exists: true, $ne: '' } },
      { $unset: { assignedManager: '' } },
    )
    console.log(`[link] cleared the old assignedManager field on ${safeToClear} lead(s)`)
  }

  const stillSet = await collection.countDocuments({ assignedManager: { $exists: true } })
  if (stillSet > 0) {
    console.log(`[link] ${stillSet} lead(s) kept the old field because nothing was preserved`)
  }

  await disconnectDatabase()
}

run().catch((error) => {
  console.error('[link] failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
