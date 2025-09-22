import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Trip from "@/models/Trip"
import Place from "@/models/Place"
import { getAuthenticatedUser, createAuthResponse } from "@/lib/auth-helpers"

// POST /api/trips/[id]/places - Add a place to a trip
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    const body = await request.json()
    const { placeData } = body

    await connectDB()

    // Find the trip
    const trip = await Trip.findOne({
      _id: params.id,
      userId: user.id,
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Create or find the place
    let place = await Place.findOne({
      userId: user.id,
      googlePlaceId: placeData.googlePlaceId || placeData.id,
    })

    if (!place) {
      // Create new place
      place = await Place.create({
        userId: user.id,
        googlePlaceId: placeData.googlePlaceId || placeData.id,
        name: placeData.name,
        address: placeData.address,
        location: {
          type: "Point",
          coordinates: [placeData.lng, placeData.lat],
        },
        type: placeData.type,
        rating: placeData.rating,
        photos: placeData.photos || [],
        userImages: placeData.userImages || [],
        notes: placeData.notes,
        tags: placeData.tags || [],
        visitPreference: placeData.visitPreference,
        phone: placeData.phone,
        website: placeData.website,
        openingHours: placeData.openingHours,
        isOpen: placeData.isOpen,
        priceLevel: placeData.priceLevel,
        reviews: placeData.reviews || [],
      })
    }

    // Add place to trip if not already there
    if (!trip.places.includes(place._id)) {
      trip.places.push(place._id)
      await trip.save()
    }

    // Return updated trip with populated places
    const updatedTrip = await Trip.findById(trip._id).populate("places")

    return NextResponse.json(updatedTrip)
  } catch (error) {
    console.error("Error adding place to trip:", error)
    return NextResponse.json({ error: "Failed to add place to trip" }, { status: 500 })
  }
}

// DELETE /api/trips/[id]/places/[placeId] - Remove a place from a trip
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("placeId")

    if (!placeId) {
      return NextResponse.json({ error: "Place ID required" }, { status: 400 })
    }

    await connectDB()

    const trip = await Trip.findOneAndUpdate(
      { _id: params.id, userId: user.id },
      { $pull: { places: placeId } },
      { new: true },
    ).populate("places")

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error("Error removing place from trip:", error)
    return NextResponse.json({ error: "Failed to remove place from trip" }, { status: 500 })
  }
}
