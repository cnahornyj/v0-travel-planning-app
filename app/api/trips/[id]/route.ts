import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Trip from "@/models/Trip"
import { getAuthenticatedUser, createAuthResponse } from "@/lib/auth-helpers"

// GET /api/trips/[id] - Get a specific trip
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    await connectDB()

    const trip = await Trip.findOne({
      _id: params.id,
      userId: user.id,
    }).populate("places")

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error("Error fetching trip:", error)
    return NextResponse.json({ error: "Failed to fetch trip" }, { status: 500 })
  }
}

// PUT /api/trips/[id] - Update a trip
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    const body = await request.json()
    const updates = { ...body }

    // Convert date strings to Date objects
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate)
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate)
    }

    await connectDB()

    const trip = await Trip.findOneAndUpdate({ _id: params.id, userId: user.id }, updates, {
      new: true,
      runValidators: true,
    }).populate("places")

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error("Error updating trip:", error)
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 })
  }
}

// DELETE /api/trips/[id] - Delete a trip
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    await connectDB()

    const trip = await Trip.findOneAndDelete({
      _id: params.id,
      userId: user.id,
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Trip deleted successfully" })
  } catch (error) {
    console.error("Error deleting trip:", error)
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 })
  }
}
