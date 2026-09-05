import { isValidObjectId, Types, type QueryFilter } from 'mongoose'
import { LeadModel, type Lead, type LeadDocument } from '../models/Lead.js'
import { UserModel } from '../models/User.js'
import { getSettings } from './settings.service.js'
import type { LeadPriority, LeadSource, LeadStatus } from '../constants/lead.js'
import { ApiError } from '../utils/ApiError.js'
import { deleteCommunicationsForLead } from './communication.service.js'
import { cancelPendingFollowUpsForLead, deleteFollowUpsForLead } from './followUp.service.js'
import { createNote, deleteNotesForLead } from './note.service.js'

export interface ListLeadsOptions {
  page: number
  limit: number
  search?: string
  status?: LeadStatus
  priority?: LeadPriority
  industry?: string
  leadSource?: LeadSource
  assignedTo?: string
  sortBy: SortableField
  sortOrder: 'asc' | 'desc'
}

/** Fields the list endpoint is allowed to sort by. */
export const SORTABLE_FIELDS = [
  'createdAt',
  'updatedAt',
  'companyName',
  'status',
  'priority',
  'lastContactedAt',
  'nextFollowUpAt',
  'dealValue',
] as const
export type SortableField = (typeof SORTABLE_FIELDS)[number]

function buildFilter(options: ListLeadsOptions): QueryFilter<Lead> {
  const filter: QueryFilter<Lead> = {}

  if (options.status) filter.status = options.status
  if (options.priority) filter.priority = options.priority
  if (options.industry) filter.industry = options.industry
  if (options.leadSource) filter.leadSource = options.leadSource
  if (options.assignedTo) {
    // "unassigned" is a real choice, not a missing filter.
    filter.assignedTo =
      options.assignedTo === 'unassigned' ? null : new Types.ObjectId(options.assignedTo)
  }

  if (options.search) {
    // Regex rather than $text so partial words ("acm") match too.
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'i')
    filter.$or = [
      { companyName: pattern },
      { contactPerson: pattern },
      { ownerName: pattern },
      { email: pattern },
      { phone: pattern },
      { city: pattern },
    ]
  }

  return filter
}

/**
 * Status and priority are stored as strings, so a plain sort would order them
 * alphabetically ("medium" before "high"). These ranks sort them by how far
 * along the sales workflow they are, and by how urgent they are.
 */
const STATUS_RANK: Record<LeadStatus, number> = {
  new: 1,
  contacted: 2,
  interested: 3,
  follow_up: 4,
  proposal: 5,
  won: 6,
  lost: 7,
}

const PRIORITY_RANK: Record<LeadPriority, number> = { low: 1, medium: 2, high: 3 }

function rankExpression(field: string, ranks: Record<string, number>) {
  return {
    $switch: {
      branches: Object.entries(ranks).map(([value, rank]) => ({
        case: { $eq: [`$${field}`, value] },
        then: rank,
      })),
      default: 0,
    },
  }
}

export async function listLeads(options: ListLeadsOptions) {
  const filter = buildFilter(options)
  const direction = options.sortOrder === 'asc' ? 1 : -1
  const skip = (options.page - 1) * options.limit

  // Sort on a ranked copy for the enum fields; everything else sorts directly.
  const sortField =
    options.sortBy === 'status' || options.sortBy === 'priority' ? '_rank' : options.sortBy

  const [result] = await LeadModel.aggregate([
    { $match: filter },
    {
      $addFields: {
        _rank:
          options.sortBy === 'status'
            ? rankExpression('status', STATUS_RANK)
            : options.sortBy === 'priority'
              ? rankExpression('priority', PRIORITY_RANK)
              : 0,
        // Leads without a date belong at the end whichever way the column is sorted.
        _isEmpty: { $cond: [{ $in: [`$${options.sortBy}`, [null, '']] }, 1, 0] },
      },
    },
    // _id breaks ties so paging never repeats or skips a lead.
    { $sort: { _isEmpty: 1, [sortField]: direction, _id: direction } },
    { $unset: ['_rank', '_isEmpty'] },
    // Bring the assigned manager's name along so the table needs no second call.
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: '_assignedTo',
        pipeline: [{ $project: { name: 1, email: 1 } }],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $cond: [
            { $gt: [{ $size: '$_assignedTo' }, 0] },
            {
              id: { $toString: { $arrayElemAt: ['$_assignedTo._id', 0] } },
              name: { $arrayElemAt: ['$_assignedTo.name', 0] },
            },
            null,
          ],
        },
      },
    },
    { $unset: ['_assignedTo'] },
    // The most recent note, so the expandable row can show it without a
    // request per lead.
    {
      $lookup: {
        from: 'notes',
        let: { leadId: '$_id' },
        as: '_latestNote',
        pipeline: [
          { $match: { $expr: { $eq: ['$lead', '$$leadId'] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'author',
              pipeline: [{ $project: { name: 1 } }],
            },
          },
          {
            $project: {
              _id: 0,
              body: 1,
              createdAt: 1,
              authorName: { $arrayElemAt: ['$author.name', 0] },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        latestNote: { $ifNull: [{ $arrayElemAt: ['$_latestNote', 0] }, null] },
      },
    },
    { $unset: ['_latestNote'] },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: options.limit }],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const documents: Array<Record<string, unknown>> = result?.items ?? []
  const total: number = result?.total?.[0]?.count ?? 0

  // Aggregation bypasses the schema's toJSON transform, so normalise ids here.
  const items = documents.map(({ _id, __v, ...rest }) => ({ id: String(_id), ...rest }))

  return {
    items,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / options.limit)),
    },
  }
}

function assertValidId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid lead id')
}

export async function getLeadById(id: string) {
  assertValidId(id)
  const lead = await LeadModel.findById(id).populate('assignedTo', 'name email')
  if (!lead) throw ApiError.notFound('Lead not found')
  return lead
}

/**
 * Records when a lead entered a status so activity and reports can count by
 * the date it happened. Earlier stamps are kept — they are the lead's history.
 */
function stampStatusChange(
  payload: Partial<Lead>,
  existing?: LeadDocument,
): Partial<Lead> {
  const status = payload.status ?? existing?.status ?? 'new'
  if (existing && payload.status === undefined) return payload
  if (existing && payload.status === existing.status) return payload

  // Merge onto the existing stamps rather than replacing the subdocument.
  const previous = existing
    ? (existing.get('statusTimestamps') as Record<string, Date | null> | undefined)
    : undefined

  return {
    ...payload,
    statusTimestamps: { ...(previous ?? {}), [status]: new Date() },
  } as Partial<Lead>
}

export async function createLead(
  payload: Partial<Lead>,
  createdBy?: string,
  initialNote?: string,
) {
  // Fall back to the workspace default rather than the schema's static one.
  const currency = payload.currency ?? (await getSettings()).defaultCurrency

  const lead = await LeadModel.create({
    currency,
    ...stampStatusChange(payload),
    ...(createdBy ? { createdBy: new Types.ObjectId(createdBy) } : {}),
  })
  // A note written while adding the lead becomes its first note.
  if (initialNote?.trim()) {
    await createNote(String(lead._id), initialNote.trim(), createdBy)
  }

  return lead.populate('assignedTo', 'name email')
}

export async function updateLead(id: string, payload: Partial<Lead>) {
  assertValidId(id)

  const existing = await LeadModel.findById(id)
  if (!existing) throw ApiError.notFound('Lead not found')

  const becameClosed =
    payload.status !== undefined &&
    payload.status !== existing.status &&
    (payload.status === 'won' || payload.status === 'lost')

  existing.set(stampStatusChange(payload, existing))
  await existing.save()

  // A won or lost lead should stop appearing in the follow-up queue.
  if (becameClosed) await cancelPendingFollowUpsForLead(existing._id)

  return existing.populate('assignedTo', 'name email')
}

export async function deleteLead(id: string) {
  assertValidId(id)
  const lead = await LeadModel.findByIdAndDelete(id)
  if (!lead) throw ApiError.notFound('Lead not found')

  // Otherwise the lead's history would be orphaned.
  await Promise.all([
    deleteCommunicationsForLead(id),
    deleteFollowUpsForLead(id),
    deleteNotesForLead(id),
  ])
  return lead
}

/**
 * Distinct values for the free-text filter fields, so the leads list can offer
 * dropdowns instead of asking managers to type an exact match.
 */
export async function getFilterOptions() {
  const [industries, managers, unassigned] = await Promise.all([
    LeadModel.distinct('industry'),
    // Anyone who can be assigned work, whether or not they hold leads today.
    UserModel.find({ isActive: true }).select('name').sort({ name: 1 }),
    LeadModel.countDocuments({ assignedTo: null }),
  ])

  const cleanIndustries = industries
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
    .sort()

  return {
    industries: cleanIndustries,
    managers: managers.map((user) => ({ id: user.id as string, name: user.name })),
    unassignedCount: unassigned,
  }
}

/** Escapes a value so it can be used inside a case-insensitive exact regex. */
function exactInsensitive(value: string) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim()}$`, 'i')
}

/** Digits only, so "+92 300 1234567" and "0300-1234567" can be compared. */
function digitsOf(value: string) {
  return value.replace(/\D/g, '')
}

export interface DuplicateQuery {
  companyName?: string
  phone?: string
  email?: string
  /** Ignore this lead — used when editing so it does not match itself. */
  excludeId?: string
}

/**
 * Finds leads that look like the same business. Advisory only: branches of one
 * company are legitimate, so this warns rather than blocks.
 */
export async function findDuplicateLeads(query: DuplicateQuery) {
  const clauses: QueryFilter<Lead>[] = []

  if (query.companyName?.trim()) {
    clauses.push({ companyName: exactInsensitive(query.companyName) })
  }
  if (query.email?.trim()) {
    clauses.push({ email: exactInsensitive(query.email) })
  }
  // Phones are stored as typed. Compare the last 9 digits, ignoring any
  // separators, so "+92 311 5687865" and "0311 5687865" match each other
  // despite the different country-code prefix.
  const phoneDigits = query.phone ? digitsOf(query.phone) : ''
  if (phoneDigits.length >= 7) {
    const tail = phoneDigits.slice(-9)
    clauses.push({ phone: new RegExp(`${tail.split('').join('\\D*')}\\D*$`) })
  }

  if (clauses.length === 0) return []

  const filter: QueryFilter<Lead> = { $or: clauses }
  if (query.excludeId && isValidObjectId(query.excludeId)) {
    filter._id = { $ne: new Types.ObjectId(query.excludeId) }
  }

  return LeadModel.find(filter)
    .select('companyName city phone email status assignedTo createdAt')
    .populate('assignedTo', 'name')
    .limit(5)
}
