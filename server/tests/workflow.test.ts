import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Client, clearData, seedUsers, startTestServer, stopTestServer } from './helpers.js'

const isoDaysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(10, 0, 0, 0)
  return date.toISOString()
}

describe('follow-ups, communications and notes', () => {
  let admin: Client
  let manager: Client
  let managerId: string
  let leadId: string

  before(startTestServer)
  after(stopTestServer)

  beforeEach(async () => {
    await clearData()
    const users = await seedUsers()
    admin = users.admin.client
    manager = users.manager.client
    managerId = users.manager.id

    const lead = await admin.post('/leads', { companyName: 'Workflow Co', assignedTo: managerId })
    leadId = lead.body.data.id
  })

  it('splits pending follow-ups into overdue, today and upcoming', async () => {
    await admin.post(`/leads/${leadId}/follow-ups`, { dueDate: isoDaysFromNow(-3) })
    await admin.post(`/leads/${leadId}/follow-ups`, { dueDate: isoDaysFromNow(0) })
    await admin.post(`/leads/${leadId}/follow-ups`, { dueDate: isoDaysFromNow(5) })

    const response = await admin.get('/follow-ups')
    assert.deepEqual(response.body.data.counts, { overdue: 1, today: 1, upcoming: 1 })
  })

  it("derives the lead's next follow-up from its earliest pending one", async () => {
    const later = await admin.post(`/leads/${leadId}/follow-ups`, { dueDate: isoDaysFromNow(10) })
    const sooner = await admin.post(`/leads/${leadId}/follow-ups`, { dueDate: isoDaysFromNow(2) })

    const withBoth = await admin.get(`/leads/${leadId}`)
    assert.equal(withBoth.body.data.nextFollowUpAt, sooner.body.data.dueDate)

    await admin.post(`/follow-ups/${sooner.body.data.id}/complete`)
    const afterComplete = await admin.get(`/leads/${leadId}`)
    assert.equal(
      afterComplete.body.data.nextFollowUpAt,
      later.body.data.dueDate,
      'falls back to the next pending one',
    )
  })

  it('records who completed a follow-up and marks the lead as contacted', async () => {
    const followUp = await admin.post(`/leads/${leadId}/follow-ups`, { dueDate: isoDaysFromNow(1) })
    await manager.post(`/follow-ups/${followUp.body.data.id}/complete`)

    const completed = await admin.get(`/leads/${leadId}/follow-ups`)
    const record = completed.body.data[0]

    assert.equal(record.status, 'completed')
    assert.equal(String(record.completedBy), managerId)
    assert.ok((await admin.get(`/leads/${leadId}`)).body.data.lastContactedAt)
  })

  it('stops chasing a lead once it is won', async () => {
    await admin.post(`/leads/${leadId}/follow-ups`, { dueDate: isoDaysFromNow(3) })
    assert.equal((await admin.get('/follow-ups')).body.data.counts.upcoming, 1)

    await admin.put(`/leads/${leadId}`, { status: 'won' })

    assert.equal((await admin.get('/follow-ups')).body.data.counts.upcoming, 0)
    assert.equal((await admin.get(`/leads/${leadId}`)).body.data.nextFollowUpAt, null)
  })

  it('links a follow-up to the conversation it was agreed on', async () => {
    const created = await manager.post(`/leads/${leadId}/communications`, {
      occurredAt: new Date().toISOString(),
      type: 'phone',
      nextAction: 'Call back',
      followUpDate: isoDaysFromNow(4),
    })
    const communicationId = created.body.data.id

    const afterCreate = await admin.get(`/leads/${leadId}/follow-ups`)
    assert.equal(afterCreate.body.data.length, 1, 'one follow-up created')

    await manager.put(`/communications/${communicationId}`, { followUpDate: isoDaysFromNow(6) })
    const afterEdit = await admin.get(`/leads/${leadId}/follow-ups`)
    assert.equal(afterEdit.body.data.length, 1, 'the same follow-up is updated, not duplicated')

    await manager.put(`/communications/${communicationId}`, { followUpDate: null })
    const afterClear = await admin.get(`/leads/${leadId}/follow-ups`)
    assert.equal(afterClear.body.data.length, 0, 'clearing the date removes the follow-up')
  })

  it('records who logged a conversation', async () => {
    await manager.post(`/leads/${leadId}/communications`, {
      occurredAt: new Date().toISOString(),
      type: 'whatsapp',
    })

    const list = await admin.get(`/leads/${leadId}/communications`)
    assert.equal(list.body.data[0].createdBy.name, 'Test Manager')
  })

  it('lets you edit your own notes but not other people’s', async () => {
    const mine = await manager.post(`/leads/${leadId}/notes`, { body: 'Manager note' })
    const theirs = await admin.post(`/leads/${leadId}/notes`, { body: 'Admin note' })

    assert.equal((await manager.put(`/notes/${mine.body.data.id}`, { body: 'Edited' })).status, 200)
    assert.equal((await manager.put(`/notes/${theirs.body.data.id}`, { body: 'Nope' })).status, 403)
    assert.equal((await manager.delete(`/notes/${theirs.body.data.id}`)).status, 403)

    // An admin moderates anyone's notes.
    assert.equal((await admin.put(`/notes/${mine.body.data.id}`, { body: 'Fixed' })).status, 200)
  })

  it('removes a lead’s history when the lead is deleted', async () => {
    await admin.post(`/leads/${leadId}/notes`, { body: 'A note' })
    await admin.post(`/leads/${leadId}/communications`, {
      occurredAt: new Date().toISOString(),
      type: 'email',
    })
    await admin.post(`/leads/${leadId}/follow-ups`, { dueDate: isoDaysFromNow(2) })

    await admin.delete(`/leads/${leadId}`)

    assert.equal((await admin.get(`/leads/${leadId}/notes`)).status, 404)
    assert.equal((await admin.get('/follow-ups')).body.data.counts.upcoming, 0)
  })

  it('warns about duplicates across name, email and phone formats', async () => {
    await admin.post('/leads', {
      companyName: 'Jhelum Jewellers',
      email: 'info@jhelum.pk',
      phone: '+92 311 5687865',
    })

    const byName = await admin.get('/leads/check-duplicates?companyName=JHELUM%20JEWELLERS')
    assert.equal(byName.body.data.length, 1, 'company name is case-insensitive')

    const byEmail = await admin.get('/leads/check-duplicates?email=INFO@JHELUM.PK')
    assert.equal(byEmail.body.data.length, 1, 'email is case-insensitive')

    for (const phone of ['0311-5687865', '(311) 5687865', '+923115687865']) {
      const byPhone = await admin.get(
        `/leads/check-duplicates?phone=${encodeURIComponent(phone)}`,
      )
      assert.equal(byPhone.body.data.length, 1, `${phone} matches the stored number`)
    }

    const different = await admin.get('/leads/check-duplicates?phone=%2B92%20300%200000001')
    assert.equal(different.body.data.length, 0, 'a different number does not match')
  })
})
