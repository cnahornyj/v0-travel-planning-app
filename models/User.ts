import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  email: string
  name: string
  image?: string
  password?: string // Added optional password field for credentials auth
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: false, // Optional because OAuth users won't have passwords
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt field before saving
UserSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
