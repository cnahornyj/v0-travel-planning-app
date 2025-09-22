import mongoose, { type Document, Schema } from "mongoose"

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  description?: string
  startDate?: Date
  endDate?: Date
  places: mongoose.Types.ObjectId[] // References to Place documents
  createdAt: Date
  updatedAt: Date
}

const TripSchema = new Schema<ITrip>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  places: [
    {
      type: Schema.Types.ObjectId,
      ref: "Place",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Validate that endDate is after startDate
TripSchema.pre("save", function (next) {
  this.updatedAt = new Date()

  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    next(new Error("End date must be after start date"))
  } else {
    next()
  }
})

export default mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema)
