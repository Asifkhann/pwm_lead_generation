import { Types } from 'mongoose'
import { LeadModel } from '../models/Lead.js'
import { UserModel } from '../models/User.js'
import { CommunicationModel } from '../models/Communication.js'
import { FollowUpModel } from '../models/FollowUp.js'
import { LEAD_STATUSES, type LeadStatus } from '../constants/lead.js'
import type { ActivityRange } from './activity.service.js'

const TOP_GROUPS = 8
const DAILY_BUCKET_LIMIT = 92

export interface CountRow {
  /** Stable identity: the stored value, or "__other__" for the folded tail. */
  key: string
  label: string
  value: number
}

/**
 * Groups leads by a field. `fold` collapses the tail into an "Other" row and is
 * only used for open-ended fields — a fixed enum shows every option instead,
 * which also avoids colliding with an enum value literally named "other".
 */
async function groupLeads(
  field: string,
  { from, to }: ActivityRange,
  emptyLabel: string,
  fold: boolean,
) {
  const rows = await LeadModel.aggregate<{ _id: string | null; count: number }>([
    { $match: { createdAt: { $gte: from, $lt: to } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])

  const named: CountRow[] = rows.map((row) => {
    const value = row._id && String(row._id).trim() ? String(row._id) : ''
    return { key: value || '__unset__', label: value || emptyLabel, value: row.count }
  })

  if (!fold || named.length <= TOP_GROUPS) return named

  const top = named.slice(0, TOP_GROUPS)
  const rest = named.slice(TOP_GROUPS).reduce((sum, row) => sum + row.value, 0)
  return rest > 0
    ? [...top, { key: '__other__', label: `Other (${named.length - TOP_GROUPS})`, value: rest }]
    : top
}

function dateKey(date: Date, monthly: boolean): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  if (monthly) return `${date.getFullYear()}-${month}`
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`
}

/** Leads created per day, or per month when the range is too long for days. */
async function getLeadsOverTime({ from, to }: ActivityRange) {
  const days = Math.ceil((to.getTime() - from.getTime()) / 86_400_000)
  const monthly = days > DAILY_BUCKET_LIMIT

  const leads = await LeadModel.find({ createdAt: { $gte: from, $lt: to } }).select('createdAt')

  const buckets = new Map<string, { date: string; value: number }>()
  const cursor = new Date(from)
  while (cursor < to) {
    buckets.set(dateKey(cursor, monthly), { date: dateKey(cursor, monthly), value: 0 })
    if (monthly) cursor.setMonth(cursor.getMonth() + 1)
    else cursor.setDate(cursor.getDate() + 1)
  }

  for (const lead of leads) {
    const bucket = buckets.get(dateKey(lead.createdAt as Date, monthly))
    if (bucket) bucket.value += 1
  }

  return { granularity: monthly ? ('month' as const) : ('day' as const), points: [...buckets.values()] }
}

async function getStatusBreakdown({ from, to }: ActivityRange) {
  const rows = await LeadModel.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: from, $lt: to } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  const counts = Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0])) as Record<
    LeadStatus,
    number
  >
  for (const row of rows) {
    if (row._id in counts) counts[row._id as LeadStatus] = row.count
  }
  return counts
}

/** Of the follow-ups due in this range, how many were actually done. */
async function getFollowUpCompletion({ from, to }: ActivityRange) {
  const now = new Date()
  const [completed, pending, overdue, cancelled] = await Promise.all([
    FollowUpModel.countDocuments({ status: 'completed', dueDate: { $gte: from, $lt: to } }),
    FollowUpModel.countDocuments({ status: 'pending', dueDate: { $gte: from, $lt: to } }),
    FollowUpModel.countDocuments({
      status: 'pending',
      dueDate: { $gte: from, $lt: to < now ? to : now },
    }),
    FollowUpModel.countDocuments({ status: 'cancelled', dueDate: { $gte: from, $lt: to } }),
  ])

  const total = completed + pending + cancelled
  return {
    completed,
    pending,
    overdue,
    cancelled,
    total,
    rate: total === 0 ? null : Math.round((completed / total) * 100),
  }
}

/**
 * Per-manager totals. Leads count by who they are assigned to; calls and
 * follow-ups count by who actually did them, which is now recorded directly
 * rather than inferred from the lead.
 */
async function getManagerPerformance({ from, to }: ActivityRange) {
  const [users, created, outcomes, communications, followUps] = await Promise.all([
    UserModel.find().select('name'),
    LeadModel.aggregate<{ _id: Types.ObjectId | null; count: number }>([
      { $match: { createdAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]),
    LeadModel.aggregate<{ _id: Types.ObjectId | null; won: number; lost: number }>([
      {
        $match: {
          $or: [
            { 'statusTimestamps.won': { $gte: from, $lt: to } },
            { 'statusTimestamps.lost': { $gte: from, $lt: to } },
          ],
        },
      },
      {
        $group: {
          _id: '$assignedTo',
          won: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$statusTimestamps.won', from] },
                    { $lt: ['$statusTimestamps.won', to] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          lost: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$statusTimestamps.lost', from] },
                    { $lt: ['$statusTimestamps.lost', to] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    CommunicationModel.aggregate<{ _id: Types.ObjectId | null; count: number }>([
      { $match: { occurredAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    ]),
    FollowUpModel.aggregate<{ _id: Types.ObjectId | null; count: number }>([
      { $match: { status: 'completed', completedAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$completedBy', count: { $sum: 1 } } },
    ]),
  ])

  const names = new Map(users.map((user) => [String(user._id), user.name]))
  const rows = new Map<
    string,
    {
      manager: string
      leadsCreated: number
      won: number
      lost: number
      communications: number
      followUpsCompleted: number
      conversionRate: number | null
    }
  >()

  const rowFor = (userId: Types.ObjectId | null) => {
    const key = userId ? String(userId) : 'unassigned'
    if (!rows.has(key)) {
      rows.set(key, {
        // Covers both unassigned leads and activity logged before authorship
        // was recorded, which is why it is not called "Unassigned".
        manager: userId ? (names.get(key) ?? 'Removed user') : 'Not attributed',
        leadsCreated: 0,
        won: 0,
        lost: 0,
        communications: 0,
        followUpsCompleted: 0,
        conversionRate: null,
      })
    }
    return rows.get(key)!
  }

  for (const row of created) rowFor(row._id).leadsCreated = row.count
  for (const row of outcomes) {
    const target = rowFor(row._id)
    target.won = row.won
    target.lost = row.lost
  }
  for (const row of communications) rowFor(row._id).communications = row.count
  for (const row of followUps) rowFor(row._id).followUpsCompleted = row.count

  for (const row of rows.values()) {
    const decided = row.won + row.lost
    row.conversionRate = decided === 0 ? null : Math.round((row.won / decided) * 100)
  }

  return [...rows.values()].sort((a, b) => b.won - a.won || b.leadsCreated - a.leadsCreated)
}

/**
 * Money totals, kept separate per currency. Adding GBP to USD would be a made
 * up number, so the reports show one row per currency instead.
 */
async function getValueByCurrency({ from, to }: ActivityRange) {
  const [won, lost, open] = await Promise.all([
    LeadModel.aggregate<{ _id: string; total: number; count: number }>([
      { $match: { 'statusTimestamps.won': { $gte: from, $lt: to }, dealValue: { $ne: null } } },
      { $group: { _id: '$currency', total: { $sum: '$dealValue' }, count: { $sum: 1 } } },
    ]),
    LeadModel.aggregate<{ _id: string; total: number; count: number }>([
      { $match: { 'statusTimestamps.lost': { $gte: from, $lt: to }, dealValue: { $ne: null } } },
      { $group: { _id: '$currency', total: { $sum: '$dealValue' }, count: { $sum: 1 } } },
    ]),
    // Open pipeline is a snapshot of everything still live, not a date range.
    LeadModel.aggregate<{ _id: string; total: number; count: number }>([
      { $match: { status: { $nin: ['won', 'lost'] }, dealValue: { $ne: null } } },
      { $group: { _id: '$currency', total: { $sum: '$dealValue' }, count: { $sum: 1 } } },
    ]),
  ])

  const merge = (rows: { _id: string; total: number; count: number }[]) =>
    rows
      .filter((row) => row.total > 0 || row.count > 0)
      .map((row) => ({ currency: row._id, total: row.total, count: row.count }))
      .sort((a, b) => b.total - a.total)

  return { won: merge(won), lost: merge(lost), open: merge(open) }
}

export async function getReports(range: ActivityRange) {
  const [
    leadsOverTime,
    byIndustry,
    bySource,
    byStatus,
    won,
    lost,
    followUps,
    managers,
    totalLeads,
    value,
  ] =
    await Promise.all([
      getLeadsOverTime(range),
      groupLeads('industry', range, 'Not set', true),
      // Lead source is a fixed list, so every option is worth showing.
      groupLeads('leadSource', range, 'Not set', false),
      getStatusBreakdown(range),
      LeadModel.countDocuments({ 'statusTimestamps.won': { $gte: range.from, $lt: range.to } }),
      LeadModel.countDocuments({ 'statusTimestamps.lost': { $gte: range.from, $lt: range.to } }),
      getFollowUpCompletion(range),
      getManagerPerformance(range),
      LeadModel.countDocuments({ createdAt: { $gte: range.from, $lt: range.to } }),
      getValueByCurrency(range),
    ])

  const decided = won + lost

  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    totalLeads,
    leadsOverTime,
    byIndustry,
    // Labels stay as the stored enum values; the client maps them for display.
    bySource,
    byStatus,
    outcomes: {
      won,
      lost,
      decided,
      conversionRate: decided === 0 ? null : Math.round((won / decided) * 100),
    },
    followUps,
    managers,
    value,
  }
}
