import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'
import { COMMUNICATION_OUTCOMES, COMMUNICATION_TYPES } from '../constants/communication.js'

const communicationSchema = new Schema(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead is required'],
    },
    // Date and time are one instant so the timeline can sort and filter on it.
    occurredAt: {
      type: Date,
      required: [true, 'Date and time are required'],
    },
    /** Who logged this conversation. */
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, enum: COMMUNICATION_TYPES, default: 'phone' },
    contactPerson: { type: String, trim: true, default: '' },
    outcome: { type: String, enum: COMMUNICATION_OUTCOMES, default: 'connected' },

    discussionNotes: { type: String, trim: true, default: '' },
    clientRequirements: { type: String, trim: true, default: '' },
    clientConcerns: { type: String, trim: true, default: '' },
    servicesDiscussed: { type: [String], default: [] },

    nextAction: { type: String, trim: true, default: '' },
    followUpDate: { type: Date, default: null },
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

// The timeline always reads one lead's history newest first.
communicationSchema.index({ lead: 1, occurredAt: -1 })
// Activity and reporting views filter across leads by date and type.
communicationSchema.index({ occurredAt: -1 })
communicationSchema.index({ type: 1 })
// "How many calls did this manager log?" for the reports.
communicationSchema.index({ createdBy: 1, occurredAt: -1 })

export type Communication = InferSchemaType<typeof communicationSchema>
export type CommunicationDocument = HydratedDocument<Communication>

export const CommunicationModel = model('Communication', communicationSchema)
