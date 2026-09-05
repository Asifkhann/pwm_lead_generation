import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { emptyLeadForm, normaliseLeadForm, validateLeadForm } from '../src/utils/leadForm'

const check = (patch: Partial<typeof emptyLeadForm>) =>
  validateLeadForm(normaliseLeadForm({ ...emptyLeadForm, ...patch }))

describe('lead form validation', () => {
  it('requires a company name', () => {
    assert.equal(check({}).companyName, 'Company name is required')
    assert.equal(check({ companyName: '   ' }).companyName, 'Company name is required')
    assert.equal(check({ companyName: 'X'.repeat(201) }).companyName, 'Company name cannot exceed 200 characters')
    assert.equal(check({ companyName: 'Acme' }).companyName, undefined)
  })

  it('accepts the phone formats people actually type', () => {
    for (const phone of [
      '+92 300 1234567',
      '(042) 111-222-333',
      '0300-1234567',
      '+1 (555) 123-4567',
      '021.111.2222',
    ]) {
      assert.equal(check({ companyName: 'A', phone }).phone, undefined, `${phone} is accepted`)
    }
  })

  it('rejects phone numbers that are not numbers', () => {
    for (const phone of ['call me', '12345', '1234567890123456789', 'a@b.co']) {
      assert.ok(check({ companyName: 'A', phone }).phone, `${phone} is rejected`)
    }
  })

  it('checks email format but allows it to be blank', () => {
    assert.equal(check({ companyName: 'A', email: '' }).email, undefined)
    assert.equal(check({ companyName: 'A', email: 'a@b.co' }).email, undefined)
    assert.ok(check({ companyName: 'A', email: 'ab.co' }).email)
    assert.ok(check({ companyName: 'A', email: 'a@b' }).email)
  })

  it('accepts a bare domain as a website', () => {
    assert.equal(check({ companyName: 'A', website: 'example.com' }).website, undefined)
    assert.equal(check({ companyName: 'A', website: 'https://example.com/x' }).website, undefined)
    assert.ok(check({ companyName: 'A', website: 'my website' }).website)
  })

  it('allows a social handle but not a broken link', () => {
    const social = (patch: Record<string, string>) =>
      check({ companyName: 'A', socialMedia: { ...emptyLeadForm.socialMedia, ...patch } })

    assert.equal(social({ instagram: '@acme' })['socialMedia.instagram'], undefined)
    assert.equal(social({ facebook: 'fb.com/acme' })['socialMedia.facebook'], undefined)
    assert.ok(social({ linkedin: 'ht tp://x .com' })['socialMedia.linkedin'])
  })

  it('rejects a negative deal value but allows zero and blank', () => {
    assert.ok(check({ companyName: 'A', dealValue: '-5' }).dealValue)
    assert.ok(check({ companyName: 'A', dealValue: 'abc' }).dealValue)
    assert.equal(check({ companyName: 'A', dealValue: '0' }).dealValue, undefined)
    assert.equal(check({ companyName: 'A', dealValue: '' }).dealValue, undefined)
  })

  it('trims whitespace before saving', () => {
    const values = normaliseLeadForm({ ...emptyLeadForm, companyName: '  Acme  ', city: ' Lahore ' })
    assert.equal(values.companyName, 'Acme')
    assert.equal(values.city, 'Lahore')
  })
})
