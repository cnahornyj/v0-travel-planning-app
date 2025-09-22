import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Place from "@/models/Place"
import { getAuthenticatedUser, createAuthResponse } from "@/lib/auth-helpers"

// GET /api/places - Get all saved places for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    await connectDB()

    const places = await Place.find({ userId: user.id }).sort({ createdAt: -1 })

    return NextResponse.json(places)
  } catch (error) {
    console.error("Error fetching places:", error)
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
  }
}

// POST /api/places - Create a new saved place
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse("Authentication required")
    }

    const body = await request.json()
    const {
      googlePlaceId,
      name,
      address,
      lat,
      lng,
      type,
      rating,
      photos,
      userImages,
      notes,
      tags,
      visitPreference,
      phone,
      website,
      openingHours,
      isOpen,
      priceLevel,
      reviews,
    } = body

    await connectDB()

    // Check if place already exists for this user
    const existingPlace = await Place.findOne({
      userId: user.id,
      googlePlaceId,
    })

    if (existingPlace) {
      return NextResponse.json({ error: "Place already saved" }, { status: 409 })
    }

    const place = await Place.create({
      userId: user.id,
      googlePlaceId,
      name,
      address,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      type,
      rating,
      photos: photos || [],
      userImages: userImages || [],
      notes,
      tags: tags || [],
      visitPreference,
      phone,
      website,
      openingHours,
      isOpen,
      priceLevel,
      reviews: reviews || [],
    })

    return NextResponse.json(place, { status: 201 })
  } catch (error) {
    console.error("Error creating place:", error)
    return NextResponse.json({ error: "Failed to create place" }, { status: 500 })
  }
}
