import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import UserPreferences from "@/models/UserPreferences"
import { getAuthenticatedUser, createAuthResponse } from "@/lib/auth-helpers"

// GET /api/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    await connectDB()

    let preferences = await UserPreferences.findOne({ userId: user.id })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: user.id,
        mapCenter: { lat: 40.7128, lng: -74.006 },
        activeTab: "search",
        preferences: {
          defaultTravelMode: "driving",
          units: "metric",
          language: "en",
        },
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }
}

// PUT /api/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    const body = await request.json()

    await connectDB()

    const preferences = await UserPreferences.findOneAndUpdate({ userId: user.id }, body, {
      new: true,
      upsert: true,
      runValidators: true,
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
