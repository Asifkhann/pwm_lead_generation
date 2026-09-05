import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>

const KEY_LENGTH = 64
const SALT_LENGTH = 16

/**
 * Hashes with scrypt from Node's crypto, so no native password dependency is
 * needed. Stored as "salt:hash", both hex.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const derived = await scrypt(password, salt, KEY_LENGTH)
  return `${salt.toString('hex')}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false

  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH)
  const expected = Buffer.from(hashHex, 'hex')

  // Length check first: timingSafeEqual throws on a mismatch.
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}
