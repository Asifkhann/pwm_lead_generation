import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'
import { ROLES } from '../constants/role.js'

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Email address is not valid',
      },
    },
    // Never selected by default, so it cannot leak through a stray query.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'senior_manager' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    /**
     * Sessions issued before this moment are refused. Bumped whenever the
     * password changes, so a reset kicks out anyone already signed in.
     */
    sessionsValidFrom: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        delete ret.passwordHash
        return ret
      },
    },
  },
)

userSchema.index({ role: 1 })

export type User = InferSchemaType<typeof userSchema>
export type UserDocument = HydratedDocument<User>

export const UserModel = model('User', userSchema)
