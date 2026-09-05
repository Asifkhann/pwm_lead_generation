import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose'
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from '../constants/lead.js'
import { CURRENCIES, DEFAULT_CURRENCY } from '../constants/currency.js'

const socialMediaSchema = new Schema(
  {
    facebook: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    other: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

const statusTimestampsSchema = new Schema(
  Object.fromEntries(LEAD_STATUSES.map((status) => [status, { type: Date, default: null }])),
  { _id: false },
)

const leadSchema = new Schema(
  {
    // Company
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    businessType: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    socialMedia: { type: socialMediaSchema, default: () => ({}) },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },

    // Contact
    ownerName: { type: String, trim: true, default: '' },
    contactPerson: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      validate: {
        validator: (value: string) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Email address is not valid',
      },
    },

    // Business analysis
    servicesRequired: { type: [String], default: [] },
    problemsFound: { type: [String], default: [] },
    opportunities: { type: [String], default: [] },

    // Money
    /** What the work is expected to be worth. Null until it is known. */
    dealValue: {
      type: Number,
      default: null,
      min: [0, 'Deal value cannot be negative'],
    },
    /** Which currency dealValue is in; defaults from the lead's country. */
    currency: { type: String, enum: CURRENCIES, default: DEFAULT_CURRENCY },

    // Sales
    leadSource: { type: String, enum: LEAD_SOURCES, default: 'other' },
    status: { type: String, enum: LEAD_STATUSES, default: 'new' },
    priority: { type: String, enum: LEAD_PRIORITIES, default: 'medium' },
    /** The manager responsible for this lead. */
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    /** Whoever added the lead. */
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    /**
     * The manager's name as free text, from before managers were user
     * accounts. Kept so the migration can be re-run once the missing people
     * have accounts; nothing reads it.
     */
    legacyAssignedManager: { type: String, trim: true, default: '' },

    // Activity
    lastContactedAt: { type: Date, default: null },
    /**
     * When the lead last entered each status, so activity and reports can ask
     * "how many leads reached this stage during a period?".
     */
    statusTimestamps: { type: statusTimestampsSchema, default: () => ({}) },
    nextFollowUpAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

// Filter fields used by the leads list.
leadSchema.index({ status: 1 })
leadSchema.index({ priority: 1 })
leadSchema.index({ industry: 1 })
leadSchema.index({ leadSource: 1 })
leadSchema.index({ assignedTo: 1 })
leadSchema.index({ createdBy: 1 })
// Follow-up queues and the default "newest first" listing.
leadSchema.index({ nextFollowUpAt: 1 })
leadSchema.index({ createdAt: -1 })
// Sorting the list by size of deal, and summing values per currency.
leadSchema.index({ currency: 1, dealValue: -1 })
// Activity and reporting views count leads that reached a stage in a date range.
leadSchema.index({ 'statusTimestamps.interested': -1 })
leadSchema.index({ 'statusTimestamps.proposal': -1 })
leadSchema.index({ 'statusTimestamps.won': -1 })
leadSchema.index({ 'statusTimestamps.lost': -1 })
// Search uses case-insensitive regex (see lead.service) so partial words match;
// that cannot use a text index, so none is declared here.
leadSchema.index({ companyName: 1 })

export type Lead = InferSchemaType<typeof leadSchema>
export type LeadDocument = HydratedDocument<Lead>

export const LeadModel = model('Lead', leadSchema)
