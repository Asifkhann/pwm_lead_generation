import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Client, clearData, seedUsers, startTestServer, stopTestServer } from './helpers.js'

describe('leads', () => {
  let admin: Client
  let adminId: string
  let managerId: string

  before(startTestServer)
  after(stopTestServer)

  beforeEach(async () => {
    await clearData()
    const users = await seedUsers()
    admin = users.admin.client
    adminId = users.admin.id
    managerId = users.manager.id
  })

  const createLead = (overrides: Record<string, unknown> = {}) =>
    admin.post('/leads', { companyName: 'Acme Ltd', ...overrides })

  it('requires a company name and applies sensible defaults', async () => {
    const missing = await admin.post('/leads', { industry: 'Retail' })
    assert.equal(missing.status, 400)
    assert.equal(missing.body.details.companyName, 'Company name is required')

    const created = await createLead()
    assert.equal(created.status, 201)
    assert.equal(created.body.data.status, 'new')
    assert.equal(created.body.data.priority, 'medium')
    assert.equal(created.body.data.leadSource, 'other')
  })

  it('ignores fields a client should not be able to set', async () => {
    const created = await admin.post('/leads', {
      companyName: 'Sneaky Ltd',
      _id: '000000000000000000000001',
      isAdmin: true,
      __v: 99,
    })

    assert.equal(created.status, 201)
    assert.notEqual(created.body.data.id, '000000000000000000000001')
    assert.ok(!('isAdmin' in created.body.data))
  })

  it('lowercases the email and drops blank list entries', async () => {
    const created = await createLead({
      email: 'Info@ACME.com',
      servicesRequired: ['SEO', '   ', 'Website'],
    })

    assert.equal(created.body.data.email, 'info@acme.com')
    assert.deepEqual(created.body.data.servicesRequired, ['SEO', 'Website'])
  })

  it('sorts priority by urgency, not alphabetically', async () => {
    await createLead({ companyName: 'Low Co', priority: 'low' })
    await createLead({ companyName: 'High Co', priority: 'high' })
    await createLead({ companyName: 'Medium Co', priority: 'medium' })

    const response = await admin.get('/leads?sortBy=priority&sortOrder=desc')
    assert.deepEqual(
      response.body.data.items.map((lead: any) => lead.priority),
      ['high', 'medium', 'low'],
    )
  })

  it('sorts status by workflow order, not alphabetically', async () => {
    await createLead({ companyName: 'Won Co', status: 'won' })
    await createLead({ companyName: 'New Co', status: 'new' })
    await createLead({ companyName: 'Proposal Co', status: 'proposal' })

    const response = await admin.get('/leads?sortBy=status&sortOrder=asc')
    assert.deepEqual(
      response.body.data.items.map((lead: any) => lead.status),
      ['new', 'proposal', 'won'],
    )
  })

  it('puts leads with no date at the end whichever way it is sorted', async () => {
    await createLead({ companyName: 'Dated Co', lastContactedAt: '2026-01-01T00:00:00.000Z' })
    await createLead({ companyName: 'Undated Co' })

    for (const order of ['asc', 'desc']) {
      const response = await admin.get(`/leads?sortBy=lastContactedAt&sortOrder=${order}`)
      const names = response.body.data.items.map((lead: any) => lead.companyName)
      assert.equal(names[names.length - 1], 'Undated Co', `empty dates last when ${order}`)
    }
  })

  it('pages without repeating or dropping a lead', async () => {
    for (let index = 0; index < 12; index += 1) {
      await createLead({ companyName: `Company ${index}`, priority: 'medium' })
    }

    const seen: string[] = []
    for (const page of [1, 2, 3]) {
      const response = await admin.get(`/leads?page=${page}&limit=5&sortBy=priority`)
      seen.push(...response.body.data.items.map((lead: any) => lead.id))
    }

    assert.equal(seen.length, 12)
    assert.equal(new Set(seen).size, 12, 'every lead appears exactly once')
  })

  it('searches partial words and escapes regex characters', async () => {
    await createLead({ companyName: 'Karachi Dental Care' })
    await createLead({ companyName: 'Lahore Motors' })

    const partial = await admin.get('/leads?search=kara')
    assert.equal(partial.body.data.pagination.total, 1)

    const injection = await admin.get('/leads?search=.*')
    assert.equal(injection.body.data.pagination.total, 0, 'regex metacharacters are escaped')
  })

  it('filters by assigned user and by unassigned', async () => {
    await createLead({ companyName: 'Assigned Co', assignedTo: managerId })
    await createLead({ companyName: 'Nobody Co' })

    const assigned = await admin.get(`/leads?assignedTo=${managerId}`)
    assert.equal(assigned.body.data.pagination.total, 1)
    assert.equal(assigned.body.data.items[0].companyName, 'Assigned Co')

    const unassigned = await admin.get('/leads?assignedTo=unassigned')
    assert.equal(unassigned.body.data.pagination.total, 1)
    assert.equal(unassigned.body.data.items[0].companyName, 'Nobody Co')
  })

  it('ignores unknown filter and sort values rather than failing', async () => {
    await createLead()

    assert.equal((await admin.get('/leads?status=banana')).body.data.pagination.total, 1)
    assert.equal((await admin.get('/leads?sortBy=password')).body.data.pagination.total, 1)
    assert.equal((await admin.get('/leads?limit=9999')).body.data.pagination.limit, 100)
  })

  it('records who created a lead and when it changed status', async () => {
    const created = await createLead()
    const id = created.body.data.id

    await admin.put(`/leads/${id}`, { status: 'won' })
    const lead = await admin.get(`/leads/${id}`)

    assert.ok(lead.body.data.statusTimestamps.won, 'won is stamped')
    assert.equal(lead.body.data.createdBy, adminId)
  })

  it('rejects a bad id with 400 and a missing one with 404', async () => {
    assert.equal((await admin.get('/leads/not-an-id')).status, 400)
    assert.equal((await admin.get('/leads/000000000000000000000001')).status, 404)
  })
})
