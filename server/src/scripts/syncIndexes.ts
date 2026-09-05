/**
 * Applies the index definitions in the models to MongoDB, dropping any index
 * that is no longer declared. Run after changing a schema's indexes.
 *
 * Usage: npm run sync:indexes
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { LeadModel } from '../models/Lead.js'
import { CommunicationModel } from '../models/Communication.js'
import { FollowUpModel } from '../models/FollowUp.js'
import { UserModel } from '../models/User.js'

async function run() {
  await connectDatabase()

  for (const model of [LeadModel, CommunicationModel, FollowUpModel, UserModel]) {
    const dropped = await model.syncIndexes()
    console.log(
      `[indexes] ${model.collection.name}: ${(await model.collection.indexes()).length} in place` +
        (dropped.length ? `, dropped ${dropped.join(', ')}` : ''),
    )
  }

  await disconnectDatabase()
}

run().catch((error) => {
  console.error('[indexes] failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
