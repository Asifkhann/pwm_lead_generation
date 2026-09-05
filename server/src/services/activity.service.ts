import { LeadModel } from '../models/Lead.js'
import { CommunicationModel } from '../models/Communication.js'
import { FollowUpModel } from '../models/FollowUp.js'
import { COMMUNICATION_TYPES, type CommunicationType } from '../constants/communication.js'

export interface ActivityRange {
  from: Date
  /** Exclusive, so a range always covers whole local days. */
  to: Date
}

/** Local YYYY-MM-DD so buckets line up with the user's calendar days. */
function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const MAX_BREAKDOWN_DAYS = 92

/** Per-day counts, skipped for ranges too long to read as a chart. */
async function getDailyBreakdown({ from, to }: ActivityRange) {
  const days = Math.ceil((to.getTime() - from.getTime()) / 86_400_000)
  if (days > MAX_BREAKDOWN_DAYS) return null

  const [leads, communications, followUps] = await Promise.all([
    LeadModel.find({ createdAt: { $gte: from, $lt: to } }).select('createdAt'),
    CommunicationModel.find({ occurredAt: { $gte: from, $lt: to } }).select('occurredAt'),
    FollowUpModel.find({ status: 'completed', completedAt: { $gte: from, $lt: to } }).select(
      'completedAt',
    ),
  ])

  const buckets = new Map<
    string,
    { date: string; leadsCreated: number; communications: number; followUpsCompleted: number }
  >()
  for (let index = 0; index < days; index += 1) {
    const day = new Date(from)
    day.setDate(day.getDate() + index)
    buckets.set(dateKey(day), {
      date: dateKey(day),
      leadsCreated: 0,
      communications: 0,
      followUpsCompleted: 0,
    })
  }

  for (const lead of leads) {
    const bucket = buckets.get(dateKey(lead.createdAt as Date))
    if (bucket) bucket.leadsCreated += 1
  }
  for (const item of communications) {
    const bucket = buckets.get(dateKey(item.occurredAt))
    if (bucket) bucket.communications += 1
  }
  for (const item of followUps) {
    if (!item.completedAt) continue
    const bucket = buckets.get(dateKey(item.completedAt))
    if (bucket) bucket.followUpsCompleted += 1
  }

  return [...buckets.values()]
}

async function countCommunicationsByType({ from, to }: ActivityRange) {
  const rows = await CommunicationModel.aggregate<{ _id: string; count: number }>([
    { $match: { occurredAt: { $gte: from, $lt: to } } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ])

  const counts = Object.fromEntries(COMMUNICATION_TYPES.map((type) => [type, 0])) as Record<
    CommunicationType,
    number
  >
  for (const row of rows) {
    if (row._id in counts) counts[row._id as CommunicationType] = row.count
  }
  return counts
}

/** Counts leads that entered the given status inside the range. */
function countReachedStatus(status: string, { from, to }: ActivityRange) {
  return LeadModel.countDocuments({ [`statusTimestamps.${status}`]: { $gte: from, $lt: to } })
}

export async function getActivitySummary(range: ActivityRange) {
  const [
    leadsCreated,
    communications,
    followUpsCompleted,
    followUpsScheduled,
    interested,
    proposals,
    won,
    lost,
    byType,
    daily,
  ] = await Promise.all([
    LeadModel.countDocuments({ createdAt: { $gte: range.from, $lt: range.to } }),
    CommunicationModel.countDocuments({ occurredAt: { $gte: range.from, $lt: range.to } }),
    FollowUpModel.countDocuments({
      status: 'completed',
      completedAt: { $gte: range.from, $lt: range.to },
    }),
    FollowUpModel.countDocuments({ createdAt: { $gte: range.from, $lt: range.to } }),
    countReachedStatus('interested', range),
    countReachedStatus('proposal', range),
    countReachedStatus('won', range),
    countReachedStatus('lost', range),
    countCommunicationsByType(range),
    getDailyBreakdown(range),
  ])

  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    totals: {
      leadsCreated,
      communications,
      followUpsCompleted,
      followUpsScheduled,
      interested,
      proposals,
      won,
      lost,
    },
    communicationsByType: byType,
    daily,
  }
}
