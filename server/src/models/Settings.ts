import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'
import { CURRENCIES, DEFAULT_CURRENCY } from '../constants/currency.js'

/**
 * Workspace settings. Exactly one document exists; `key` keeps it that way.
 * Every field here replaces something that used to be hardcoded.
 */
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'workspace', unique: true, immutable: true },

    organisationName: {
      type: String,
      required: [true, 'Organisation name is required'],
      trim: true,
      maxlength: [80, 'Organisation name cannot exceed 80 characters'],
      default: 'Perfect Web Metrix',
    },
    /** Currency used for new leads when the country does not suggest one. */
    defaultCurrency: { type: String, enum: CURRENCIES, default: DEFAULT_CURRENCY },
    /** How far ahead the follow-ups page looks. */
    upcomingFollowUpDays: {
      type: Number,
      default: 30,
      min: [1, 'Must be at least 1 day'],
      max: [365, 'Cannot exceed 365 days'],
    },
    /** Rows per page on the leads list. */
    leadsPerPage: {
      type: Number,
      default: 20,
      min: [5, 'Must be at least 5'],
      max: [100, 'Cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id
        delete ret.__v
        delete ret.key
        return ret
      },
    },
  },
)

export type Settings = InferSchemaType<typeof settingsSchema>
export type SettingsDocument = HydratedDocument<Settings>

export const SettingsModel = model('Settings', settingsSchema)
