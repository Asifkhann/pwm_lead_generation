/**
 * Creates the first admin account so someone can sign in.
 *
 * Usage: npm run create:admin -- "Name" email@example.com password
 * Falls back to a development default when no arguments are given.
 *
 * If the email already exists it is PROMOTED TO ADMIN and its password reset,
 * so it doubles as an admin recovery tool. To reset someone's password without
 * changing their role, use `npm run reset:password` instead.
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { UserModel } from '../models/User.js'
import { hashPassword } from '../utils/password.js'

const [name = 'Admin', email = 'admin@perfectwebmetrix.com', password = 'changeme123'] =
  process.argv.slice(2)

async function run() {
  if (password.length < 8) {
    console.error('[admin] password must be at least 8 characters')
    process.exit(1)
  }

  await connectDatabase()

  const passwordHash = await hashPassword(password)
  const existing = await UserModel.findOne({ email: email.toLowerCase() })

  if (existing) {
    const previousRole = existing.role
    existing.set({
      name,
      role: 'admin',
      isActive: true,
      passwordHash,
      // A reset signs out anyone already using the account.
      sessionsValidFrom: new Date(),
    })
    await existing.save()
    console.log(`[admin] updated existing account: ${email}`)
    if (previousRole !== 'admin') {
      console.log(`[admin] note: role changed from "${previousRole}" to "admin".`)
      console.log('[admin] to reset a password without changing the role, use: npm run reset:password')
    }
  } else {
    await UserModel.create({ name, email, role: 'admin', passwordHash })
    console.log(`[admin] created: ${email}`)
  }

  console.log(`[admin] sign in with  ${email}  /  ${password}`)
  if (password === 'changeme123') console.log('[admin] change this password after signing in.')

  await disconnectDatabase()
}

run().catch((error) => {
  console.error('[admin] failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
