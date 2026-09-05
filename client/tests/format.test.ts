import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  describeRelativeDay,
  formatMoney,
  fromDateInputValue,
  fromDateTimeInputs,
  toDateInputValue,
  toDisplayUrl,
  toExternalUrl,
  toTimeInputValue,
} from '../src/utils/format'

describe('dates', () => {
  it('round-trips a picked date without shifting a day', () => {
    for (const picked of ['2026-09-20', '2026-01-01', '2026-12-31']) {
      const stored = fromDateInputValue(picked)
      assert.equal(toDateInputValue(stored), picked, `${picked} survives the round trip`)
    }
  })

  it('round-trips a date and time', () => {
    for (const [date, time] of [
      ['2026-09-04', '14:30'],
      ['2026-01-01', '00:00'],
      ['2026-12-31', '23:59'],
    ]) {
      const stored = fromDateTimeInputs(date, time)
      assert.equal(`${toDateInputValue(stored)} ${toTimeInputValue(stored)}`, `${date} ${time}`)
    }
  })

  it('describes how far away a follow-up is', () => {
    const day = (offset: number) => {
      const date = new Date()
      date.setDate(date.getDate() + offset)
      return date.toISOString()
    }

    assert.equal(describeRelativeDay(day(0)), 'Today')
    assert.equal(describeRelativeDay(day(1)), 'Tomorrow')
    assert.equal(describeRelativeDay(day(-1)), '1 day overdue')
    assert.equal(describeRelativeDay(day(-5)), '5 days overdue')
    assert.equal(describeRelativeDay(day(6)), 'in 6 days')
    assert.equal(describeRelativeDay(null), null)
  })
})

describe('money', () => {
  it('formats each currency with its own symbol', () => {
    assert.match(formatMoney(1500, 'GBP'), /1,500/)
    assert.match(formatMoney(1500, 'USD'), /1,500/)
    assert.ok(formatMoney(1500, 'GBP') !== formatMoney(1500, 'USD'), 'symbols differ')
  })

  it('shows a dash when there is no value', () => {
    assert.equal(formatMoney(null, 'GBP'), '—')
    assert.equal(formatMoney(undefined, 'GBP'), '—')
  })

  it('keeps zero as a real value, not a dash', () => {
    assert.match(formatMoney(0, 'GBP'), /0/)
  })
})

describe('websites', () => {
  it('adds a protocol only when one is missing', () => {
    assert.equal(toExternalUrl('acme.pk'), 'https://acme.pk')
    assert.equal(toExternalUrl('http://acme.pk'), 'http://acme.pk')
    assert.equal(toExternalUrl('https://acme.pk'), 'https://acme.pk')
  })

  it('shortens a URL for display', () => {
    assert.equal(toDisplayUrl('https://www.acme.pk'), 'acme.pk')
    assert.equal(toDisplayUrl('https://acme.pk/'), 'acme.pk')
    assert.equal(toDisplayUrl('https://www.acme.pk/services/seo'), 'acme.pk/services/seo')
    assert.equal(toDisplayUrl('acme.pk'), 'acme.pk')
  })
})
