import mongoose, { type Document, Schema } from "mongoose"

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId
  mapCenter: {
    lat: number
    lng: number
  }
  activeTab: "search" | "saved" | "trips"
  preferences: {
    defaultTravelMode?: "driving" | "walking" | "transit" | "bicycling"
    units?: "metric" | "imperial"
    language?: string
  }
  updatedAt: Date
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  mapCenter: {
    lat: {
      type: Number,
      required: true,
      default: 40.7128,
    },
    lng: {
      type: Number,
      required: true,
      default: -74.006,
    },
  },
  activeTab: {
    type: String,
    enum: ["search", "saved", "trips"],
    default: "search",
  },
  preferences: {
    defaultTravelMode: {
      type: String,
      enum: ["driving", "walking", "transit", "bicycling"],
      default: "driving",
    },
    units: {
      type: String,
      enum: ["metric", "imperial"],
      default: "metric",
    },
    language: {
      type: String,
      default: "en",
    },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt field before saving
UserPreferencesSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.UserPreferences ||
  mongoose.model<IUserPreferences>("UserPreferences", UserPreferencesSchema)
