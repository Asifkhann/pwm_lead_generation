import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rangeFromInputs, resolvePreset } from '../src/utils/dateRanges'

// A fixed Saturday, so the expectations never depend on when the tests run.
const SATURDAY = new Date(2026, 8, 5, 14, 0)
const days = (range: { from: Date; to: Date }) =>
  Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000)

describe('date range presets', () => {
  it('covers exactly one day for today and yesterday', () => {
    assert.equal(days(resolvePreset('today', SATURDAY)), 1)
    assert.equal(days(resolvePreset('yesterday', SATURDAY)), 1)
    assert.equal(resolvePreset('yesterday', SATURDAY).to.getDate(), 5)
  })

  it('runs weeks Monday to Sunday', () => {
    const thisWeek = resolvePreset('this_week', SATURDAY)
    assert.equal(days(thisWeek), 7)
    assert.equal(thisWeek.from.getDay(), 1, 'starts on a Monday')
    assert.equal(thisWeek.from.getDate(), 31, 'Saturday 5 Sept belongs to the week from 31 Aug')

    // Sunday belongs to the week that began the previous Monday.
    const sunday = resolvePreset('this_week', new Date(2026, 8, 6))
    assert.equal(sunday.from.getDate(), 31)
  })

  it('covers whole months and rolling windows', () => {
    assert.equal(days(resolvePreset('this_month', SATURDAY)), 30, 'September has 30 days')
    assert.equal(days(resolvePreset('last_7_days', SATURDAY)), 7)
    assert.equal(days(resolvePreset('last_30_days', SATURDAY)), 30)
    assert.equal(days(resolvePreset('last_90_days', SATURDAY)), 90)
    assert.equal(days(resolvePreset('this_year', SATURDAY)), 365)
  })

  it('treats a custom range as inclusive of the end date', () => {
    assert.equal(days(rangeFromInputs('2026-09-01', '2026-09-05')!), 5)
    assert.equal(days(rangeFromInputs('2026-09-05', '2026-09-05')!), 1)
  })

  it('returns nothing for an impossible range', () => {
    assert.equal(rangeFromInputs('2026-09-05', '2026-09-01'), null)
    assert.equal(rangeFromInputs('', '2026-09-01'), null)
    assert.equal(rangeFromInputs('2026-09-01', ''), null)
  })
})
