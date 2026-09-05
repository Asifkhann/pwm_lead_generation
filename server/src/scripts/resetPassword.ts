/**
 * Resets any account's password from the terminal, leaving their role alone.
 * The recovery path when someone is locked out and no admin can help.
 *
 * Usage: npm run reset:password -- email@example.com newpassword
 *
 * Needs access to the server and its database — it does not sign in.
 * The reset also signs out that account's existing sessions.
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { UserModel } from '../models/User.js'
import { hashPassword } from '../utils/password.js'

const [email, password] = process.argv.slice(2)

async function run() {
  if (!email || !password) {
    console.error('[reset] usage: npm run reset:password -- email@example.com newpassword')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('[reset] password must be at least 8 characters')
    process.exit(1)
  }

  await connectDatabase()

  const user = await UserModel.findOne({ email: email.toLowerCase().trim() })
  if (!user) {
    console.error(`[reset] no account with the email ${email}`)
    await disconnectDatabase()
    process.exit(1)
  }

  user.passwordHash = await hashPassword(password)
  // Anyone already signed in as this account is signed out.
  user.sessionsValidFrom = new Date()
  // Deliberately not touching role or isActive.
  await user.save()

  console.log(`[reset] password updated for ${user.email} (role unchanged: ${user.role})`)
  if (!user.isActive) console.log('[reset] note: this account is disabled and still cannot sign in.')

  await disconnectDatabase()
}

run().catch((error) => {
  console.error('[reset] failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
