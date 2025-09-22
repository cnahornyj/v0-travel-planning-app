import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Trip from "@/models/Trip"
import { getAuthenticatedUser, createAuthResponse } from "@/lib/auth-helpers"

// GET /api/trips - Get all trips for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    await connectDB()

    const trips = await Trip.find({ userId: user.id }).populate("places").sort({ createdAt: -1 })

    return NextResponse.json(trips)
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    const body = await request.json()
    const { name, description, startDate, endDate, places } = body

    await connectDB()

    const trip = await Trip.create({
      userId: user.id,
      name,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      places: places || [],
    })

    // Populate places before returning
    await trip.populate("places")

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
  }
}
