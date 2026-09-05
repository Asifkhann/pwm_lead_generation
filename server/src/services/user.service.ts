import { isValidObjectId } from 'mongoose'
import { UserModel, type User } from '../models/User.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { ApiError } from '../utils/ApiError.js'

function assertValidId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid user id')
}

export async function listUsers() {
  return UserModel.find().sort({ createdAt: 1 })
}

export async function getUserById(id: string) {
  assertValidId(id)
  const user = await UserModel.findById(id)
  if (!user) throw ApiError.notFound('User not found')
  return user
}

/** Turns MongoDB's duplicate-key error into a message about the email field. */
function asDuplicateEmailError(error: unknown): unknown {
  const code = (error as { code?: number } | null)?.code
  return code === 11000
    ? ApiError.badRequest('Validation failed', { email: 'That email is already in use' })
    : error
}

export async function createUser(payload: Partial<User> & { password?: string }) {
  const { password, ...rest } = payload
  if (!password || password.length < 8) {
    throw ApiError.badRequest('Validation failed', {
      password: 'Password must be at least 8 characters',
    })
  }

  try {
    return await UserModel.create({
      ...rest,
      passwordHash: await hashPassword(password),
      sessionsValidFrom: new Date(),
    })
  } catch (error) {
    throw asDuplicateEmailError(error)
  }
}

export async function updateUser(id: string, payload: Partial<User> & { password?: string }) {
  assertValidId(id)

  const user = await UserModel.findById(id)
  if (!user) throw ApiError.notFound('User not found')

  const { password, ...rest } = payload
  if (password !== undefined) {
    if (password.length < 8) {
      throw ApiError.badRequest('Validation failed', {
        password: 'Password must be at least 8 characters',
      })
    }
    user.passwordHash = await hashPassword(password)
    // Signs out anyone already using this account.
    user.sessionsValidFrom = new Date()
  }

  user.set(rest)

  try {
    await user.save()
  } catch (error) {
    throw asDuplicateEmailError(error)
  }
  return user
}

export async function deleteUser(id: string, actingUserId: string) {
  assertValidId(id)
  if (id === actingUserId) throw ApiError.badRequest('You cannot delete your own account')

  const user = await UserModel.findById(id)
  if (!user) throw ApiError.notFound('User not found')

  // Never remove the last admin — nobody would be able to manage users.
  if (user.role === 'admin') {
    const admins = await UserModel.countDocuments({ role: 'admin', isActive: true })
    if (admins <= 1) throw ApiError.badRequest('You cannot remove the only admin')
  }

  await user.deleteOne()
  return user
}

/** Returns null rather than saying which half of the credentials was wrong. */
export async function authenticate(email: string, password: string) {
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).select(
    '+passwordHash',
  )
  if (!user || !user.isActive) return null

  const matches = await verifyPassword(password, user.passwordHash)
  if (!matches) return null

  user.lastLoginAt = new Date()
  await user.save()
  return user
}

/** Self-service password change: proves the current password before setting a new one. */
export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  if (newPassword.length < 8) {
    throw ApiError.badRequest('Validation failed', {
      newPassword: 'Password must be at least 8 characters',
    })
  }
  if (newPassword === currentPassword) {
    throw ApiError.badRequest('Validation failed', {
      newPassword: 'Choose a password you have not used here before',
    })
  }

  const user = await UserModel.findById(userId).select('+passwordHash')
  if (!user) throw ApiError.notFound('User not found')

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest('Validation failed', {
      currentPassword: 'That is not your current password',
    })
  }

  user.passwordHash = await hashPassword(newPassword)
  user.sessionsValidFrom = new Date()
  await user.save()
  return user
}
