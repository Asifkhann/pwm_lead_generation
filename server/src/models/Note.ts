import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'

/**
 * A single note on a lead. Previously all notes were concatenated into one
 * string on the lead, which meant no author and no way to edit or remove an
 * individual entry.
 */
const noteSchema = new Schema(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead is required'],
    },
    body: {
      type: String,
      required: [true, 'A note cannot be empty'],
      trim: true,
      maxlength: [5000, 'A note cannot exceed 5000 characters'],
    },
    /** Null for notes imported from the old single-field format. */
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
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

// A lead's notes, newest first.
noteSchema.index({ lead: 1, createdAt: -1 })

export type Note = InferSchemaType<typeof noteSchema>
export type NoteDocument = HydratedDocument<Note>

export const NoteModel = model('Note', noteSchema)
