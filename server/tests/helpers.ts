/**
 * Test harness. Boots the real Express app against a SEPARATE database so a
 * test run can never touch development data, and gives each test file a clean
 * slate.
 */
import mongoose from 'mongoose'
import type { Server } from 'node:http'
import { createApp } from '../src/app.js'
import { UserModel } from '../src/models/User.js'
import { hashPassword } from '../src/utils/password.js'
import type { Role } from '../src/constants/role.js'

let server: Server
let baseUrl: string

export async function startTestServer(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? ''
  if (!uri.includes('test')) {
    throw new Error(
      `Refusing to run tests against "${uri}" — the database name must contain "test".`,
    )
  }

  await mongoose.connect(uri)
  // Files run one at a time (--test-concurrency=1); start each from empty.
  await mongoose.connection.db?.dropDatabase()

  server = createApp().listen(0)
  await new Promise((resolve) => server.once('listening', resolve))

  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Server did not bind a port')
  baseUrl = `http://127.0.0.1:${address.port}/api`
}

export async function stopTestServer(): Promise<void> {
  await new Promise((resolve) => server.close(resolve))
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
}

/** Empties every collection between tests, leaving indexes in place. */
export async function clearData(): Promise<void> {
  const collections = await mongoose.connection.db?.collections()
  for (const collection of collections ?? []) await collection.deleteMany({})
}

export interface Response<T = any> {
  status: number
  body: T
}

/** A signed-in (or anonymous) client that remembers its session cookie. */
export class Client {
  private cookie = ''

  async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response<T>> {
    const response = await fetch(baseUrl + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })

    const setCookie = response.headers.get('set-cookie')
    if (setCookie) this.cookie = setCookie.split(';')[0]

    const text = await response.text()
    return { status: response.status, body: text ? JSON.parse(text) : undefined }
  }

  get = <T = any>(path: string) => this.request<T>('GET', path)
  post = <T = any>(path: string, body?: unknown) => this.request<T>('POST', path, body)
  put = <T = any>(path: string, body?: unknown) => this.request<T>('PUT', path, body)
  delete = <T = any>(path: string) => this.request<T>('DELETE', path)

  async signIn(email: string, password: string): Promise<void> {
    const response = await this.post('/auth/login', { email, password })
    if (response.status !== 200) throw new Error(`Sign-in failed for ${email}`)
  }
}

/** Creates a user directly, bypassing the API, and returns a signed-in client. */
export async function createUser(
  name: string,
  email: string,
  password: string,
  role: Role,
): Promise<{ id: string; client: Client }> {
  const user = await UserModel.create({
    name,
    email,
    role,
    passwordHash: await hashPassword(password),
  })

  const client = new Client()
  await client.signIn(email, password)
  return { id: String(user._id), client }
}

/** An admin and a senior manager, both signed in. */
export async function seedUsers() {
  const admin = await createUser('Test Admin', 'admin@test.local', 'adminpass123', 'admin')
  const manager = await createUser(
    'Test Manager',
    'manager@test.local',
    'managerpass123',
    'senior_manager',
  )
  return { admin, manager }
}
