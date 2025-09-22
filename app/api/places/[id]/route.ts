import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Place from "@/models/Place"
import { getAuthenticatedUser, createAuthResponse } from "@/lib/auth-helpers"

// GET /api/places/[id] - Get a specific place
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    await connectDB()

    const place = await Place.findOne({
      _id: params.id,
      userId: user.id,
    })

    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    return NextResponse.json(place)
  } catch (error) {
    console.error("Error fetching place:", error)
    return NextResponse.json({ error: "Failed to fetch place" }, { status: 500 })
  }
}

// PUT /api/places/[id] - Update a place
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    const body = await request.json()
    const updates = { ...body }

    // Update location if lat/lng provided
    if (body.lat && body.lng) {
      updates.location = {
        type: "Point",
        coordinates: [body.lng, body.lat],
      }
      delete updates.lat
      delete updates.lng
    }

    await connectDB()

    const place = await Place.findOneAndUpdate({ _id: params.id, userId: user.id }, updates, {
      new: true,
      runValidators: true,
    })

    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    return NextResponse.json(place)
  } catch (error) {
    console.error("Error updating place:", error)
    return NextResponse.json({ error: "Failed to update place" }, { status: 500 })
  }
}

// DELETE /api/places/[id] - Delete a place
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    await connectDB()

    const place = await Place.findOneAndDelete({
      _id: params.id,
      userId: user.id,
    })

    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Place deleted successfully" })
  } catch (error) {
    console.error("Error deleting place:", error)
    return NextResponse.json({ error: "Failed to delete place" }, { status: 500 })
  }
}
