import mongoose, { type Document, Schema } from "mongoose"

export interface IPlace extends Document {
  userId: mongoose.Types.ObjectId
  googlePlaceId: string
  name: string
  address: string
  location: {
    type: "Point"
    coordinates: [number, number] // [lng, lat] - GeoJSON format
  }
  type?: string
  rating?: number
  photos: string[]
  userImages: string[]
  notes?: string
  tags: string[]
  visitPreference?: "morning" | "afternoon" | "evening" | "night" | "anytime"
  phone?: string
  website?: string
  openingHours?: {
    periods: Array<{
      open: { day: number; time: string }
      close?: { day: number; time: string }
    }>
    weekdayText: string[]
  }
  isOpen?: boolean
  priceLevel?: number
  reviews?: Array<{
    author: string
    rating: number
    text: string
    time: number
  }>
  createdAt: Date
  updatedAt: Date
}

const PlaceSchema = new Schema<IPlace>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  googlePlaceId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      index: "2dsphere", // Enable geospatial queries
    },
  },
  type: {
    type: String,
    enum: ["restaurant", "tourist_attraction", "lodging", "museum", "park", "shopping_mall", "place"],
    default: "place",
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  photos: [
    {
      type: String,
    },
  ],
  userImages: [
    {
      type: String,
    },
  ],
  notes: {
    type: String,
    trim: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  visitPreference: {
    type: String,
    enum: ["morning", "afternoon", "evening", "night", "anytime"],
  },
  phone: String,
  website: String,
  openingHours: {
    periods: [
      {
        open: {
          day: { type: Number, min: 0, max: 6 },
          time: String,
        },
        close: {
          day: { type: Number, min: 0, max: 6 },
          time: String,
        },
      },
    ],
    weekdayText: [String],
  },
  isOpen: Boolean,
  priceLevel: {
    type: Number,
    min: 0,
    max: 4,
  },
  reviews: [
    {
      author: String,
      rating: { type: Number, min: 0, max: 5 },
      text: String,
      time: Number,
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

// Compound index for user-specific place lookups
PlaceSchema.index({ userId: 1, googlePlaceId: 1 }, { unique: true })

// Update the updatedAt field before saving
PlaceSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Place || mongoose.model<IPlace>("Place", PlaceSchema)
