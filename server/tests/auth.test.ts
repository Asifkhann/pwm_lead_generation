import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Client, seedUsers, startTestServer, stopTestServer } from './helpers.js'

describe('authentication and permissions', () => {
  let admin: Client
  let manager: Client
  const anonymous = new Client()

  before(async () => {
    await startTestServer()
    const users = await seedUsers()
    admin = users.admin.client
    manager = users.manager.client
  })

  after(stopTestServer)

  it('rejects every business endpoint without a session', async () => {
    for (const path of ['/leads', '/dashboard', '/reports', '/activity', '/follow-ups', '/users']) {
      const response = await anonymous.get(path)
      assert.equal(response.status, 401, `${path} should require a session`)
    }
  })

  it('leaves the health check public', async () => {
    assert.equal((await anonymous.get('/health')).status, 200)
  })

  it('gives the same message for a wrong password and an unknown email', async () => {
    const wrongPassword = await anonymous.post('/auth/login', {
      email: 'admin@test.local',
      password: 'nope',
    })
    const unknownEmail = await anonymous.post('/auth/login', {
      email: 'nobody@test.local',
      password: 'adminpass123',
    })

    assert.equal(wrongPassword.status, 401)
    assert.equal(unknownEmail.status, 401)
    assert.equal(wrongPassword.body.message, unknownEmail.body.message)
  })

  it('never returns the password hash', async () => {
    const response = await admin.get('/auth/me')
    assert.equal(response.status, 200)
    assert.ok(!JSON.stringify(response.body).includes('passwordHash'))
  })

  it('lets an admin do everything a manager cannot', async () => {
    assert.equal((await admin.get('/users')).status, 200)
    assert.equal((await manager.get('/users')).status, 403)

    const created = await admin.post('/leads', { companyName: 'Permission Co' })
    assert.equal(created.status, 201)

    const id = created.body.data.id
    assert.equal((await manager.put(`/leads/${id}`, { priority: 'high' })).status, 200)
    assert.equal((await manager.delete(`/leads/${id}`)).status, 403)
    assert.equal((await admin.delete(`/leads/${id}`)).status, 200)
  })

  it('ends other sessions when a password changes', async () => {
    const victim = new Client()
    await victim.signIn('manager@test.local', 'managerpass123')
    assert.equal((await victim.get('/leads')).status, 200)

    const users = await admin.get('/users')
    const managerId = users.body.data.find((u: any) => u.email === 'manager@test.local').id
    await new Promise((resolve) => setTimeout(resolve, 1100))
    await admin.put(`/users/${managerId}`, { password: 'brandnewpass123' })

    assert.equal((await victim.get('/leads')).status, 401)
  })

  it('refuses to let an admin lock themselves out', async () => {
    const me = await admin.get('/auth/me')
    const id = me.body.data.user.id

    assert.equal((await admin.delete(`/users/${id}`)).status, 400)
    assert.equal((await admin.put(`/users/${id}`, { role: 'senior_manager' })).status, 400)
    assert.equal((await admin.put(`/users/${id}`, { isActive: false })).status, 400)
  })
})
