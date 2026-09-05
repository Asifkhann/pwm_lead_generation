import { LeadModel } from '../models/Lead.js'
import { CommunicationModel } from '../models/Communication.js'
import { FollowUpModel } from '../models/FollowUp.js'
import { LEAD_STATUSES, type LeadStatus } from '../constants/lead.js'
import { dayBounds } from './followUp.service.js'

const TREND_DAYS = 14

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return { start, end }
}

/** Local YYYY-MM-DD, so buckets line up with the user's calendar days. */
function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

async function countByStatus(): Promise<Record<LeadStatus, number>> {
  const rows = await LeadModel.aggregate<{ _id: string; count: number }>([
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

/**
 * Leads created and conversations logged per day for the last two weeks.
 * Grouped in JS rather than by $dateToString so the days match local time.
 */
async function getTrend(from: Date) {
  const [leads, communications] = await Promise.all([
    LeadModel.find({ createdAt: { $gte: from } }).select('createdAt'),
    CommunicationModel.find({ occurredAt: { $gte: from } }).select('occurredAt'),
  ])

  const days = new Map<string, { date: string; leads: number; communications: number }>()
  for (let index = 0; index < TREND_DAYS; index += 1) {
    const day = new Date(from)
    day.setDate(day.getDate() + index)
    days.set(dateKey(day), { date: dateKey(day), leads: 0, communications: 0 })
  }

  for (const lead of leads) {
    const bucket = days.get(dateKey(lead.createdAt as Date))
    if (bucket) bucket.leads += 1
  }
  for (const communication of communications) {
    const bucket = days.get(dateKey(communication.occurredAt))
    if (bucket) bucket.communications += 1
  }

  return [...days.values()]
}

/** Deal totals per currency; mixing currencies into one number would be fiction. */
async function getValueSummary(monthStart: Date, monthEnd: Date) {
  const [wonThisMonth, openPipeline] = await Promise.all([
    LeadModel.aggregate<{ _id: string; total: number; count: number }>([
      {
        $match: {
          'statusTimestamps.won': { $gte: monthStart, $lt: monthEnd },
          dealValue: { $ne: null },
        },
      },
      { $group: { _id: '$currency', total: { $sum: '$dealValue' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    LeadModel.aggregate<{ _id: string; total: number; count: number }>([
      { $match: { status: { $nin: ['won', 'lost'] }, dealValue: { $ne: null } } },
      { $group: { _id: '$currency', total: { $sum: '$dealValue' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
  ])

  const shape = (rows: { _id: string; total: number; count: number }[]) =>
    rows.map((row) => ({ currency: row._id, total: row.total, count: row.count }))

  return { wonThisMonth: shape(wonThisMonth), openPipeline: shape(openPipeline) }
}

export async function getDashboardSummary() {
  const { start: todayStart, end: todayEnd } = dayBounds()
  const { start: monthStart, end: monthEnd } = monthBounds()

  const trendFrom = new Date(todayStart)
  trendFrom.setDate(trendFrom.getDate() - (TREND_DAYS - 1))

  const [
    total,
    byStatus,
    overdue,
    dueToday,
    upcoming,
    leadsAddedToday,
    communicationsToday,
    followUpsCompletedToday,
    wonThisMonth,
    lostThisMonth,
    leadsAddedThisMonth,
    trend,
    value,
  ] = await Promise.all([
    LeadModel.countDocuments(),
    countByStatus(),
    FollowUpModel.countDocuments({ status: 'pending', dueDate: { $lt: todayStart } }),
    FollowUpModel.countDocuments({
      status: 'pending',
      dueDate: { $gte: todayStart, $lt: todayEnd },
    }),
    FollowUpModel.countDocuments({ status: 'pending', dueDate: { $gte: todayEnd } }),
    LeadModel.countDocuments({ createdAt: { $gte: todayStart, $lt: todayEnd } }),
    CommunicationModel.countDocuments({ occurredAt: { $gte: todayStart, $lt: todayEnd } }),
    FollowUpModel.countDocuments({
      status: 'completed',
      completedAt: { $gte: todayStart, $lt: todayEnd },
    }),
    LeadModel.countDocuments({ 'statusTimestamps.won': { $gte: monthStart, $lt: monthEnd } }),
    LeadModel.countDocuments({ 'statusTimestamps.lost': { $gte: monthStart, $lt: monthEnd } }),
    LeadModel.countDocuments({ createdAt: { $gte: monthStart, $lt: monthEnd } }),
    getTrend(trendFrom),
    getValueSummary(monthStart, monthEnd),
  ])

  const decided = byStatus.won + byStatus.lost

  return {
    totals: { total, ...byStatus },
    followUps: { overdue, dueToday, upcoming },
    today: {
      leadsAdded: leadsAddedToday,
      communications: communicationsToday,
      followUpsCompleted: followUpsCompletedToday,
    },
    month: { won: wonThisMonth, lost: lostThisMonth, leadsAdded: leadsAddedThisMonth },
    // Share of decided leads that were won; null while nothing is decided.
    conversionRate: decided === 0 ? null : Math.round((byStatus.won / decided) * 100),
    value,
    trend,
  }
}
