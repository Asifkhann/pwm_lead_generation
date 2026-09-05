import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'
import { FOLLOW_UP_STATUSES } from '../constants/followUp.js'

const followUpSchema = new Schema(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'A due date is required'],
    },
    note: { type: String, trim: true, default: '' },
    status: { type: String, enum: FOLLOW_UP_STATUSES, default: 'pending' },
    completedAt: { type: Date, default: null },
    /** Who scheduled it, and who actually did it. */
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    /** Set when the follow-up was agreed during a recorded conversation. */
    communication: {
      type: Schema.Types.ObjectId,
      ref: 'Communication',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

// The follow-ups page reads pending items by due date.
followUpSchema.index({ status: 1, dueDate: 1 })
// A lead's own follow-up list, and deriving its next due date.
followUpSchema.index({ lead: 1, status: 1, dueDate: 1 })
// "Completed today" counts for the dashboard and activity views.
followUpSchema.index({ status: 1, completedAt: -1 })
// Finding the follow-up that belongs to a communication.
followUpSchema.index({ communication: 1 })
// "How many follow-ups did this manager complete?" for the reports.
followUpSchema.index({ completedBy: 1, completedAt: -1 })

export type FollowUp = InferSchemaType<typeof followUpSchema>
export type FollowUpDocument = HydratedDocument<FollowUp>

export const FollowUpModel = model('FollowUp', followUpSchema)
