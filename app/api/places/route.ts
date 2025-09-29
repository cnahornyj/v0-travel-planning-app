import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// GET all saved places
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("travel-planner")
    const places = await db.collection("places").find({}).toArray()

    return NextResponse.json({ places })
  } catch (error) {
    console.error("[v0] Error fetching places:", error)
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
  }
}

// POST save new place
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[v0] Attempting to save place:", body.name)

    if (!body.id || !body.name || !body.lat || !body.lng) {
      console.error("[v0] Missing required fields:", { id: body.id, name: body.name, lat: body.lat, lng: body.lng })
      return NextResponse.json({ error: "Missing required fields: id, name, lat, lng" }, { status: 400 })
    }

    console.log("[v0] Connecting to MongoDB...")
    const client = await clientPromise
    console.log("[v0] MongoDB connected successfully")

    const db = client.db("travel-planner")

    // Check if place already exists
    const existing = await db.collection("places").findOne({ id: body.id })
    if (existing) {
      console.log("[v0] Place already exists:", body.id)
      return NextResponse.json({ place: existing })
    }

    const sanitizedPlace = {
      id: body.id,
      name: body.name,
      address: body.address || "",
      lat: body.lat,
      lng: body.lng,
      type: body.type || null,
      rating: body.rating || null,
      photos: Array.isArray(body.photos) ? body.photos : [],
      userImages: Array.isArray(body.userImages) ? body.userImages : [],
      saved: true,
      notes: body.notes || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      visitPreference: body.visitPreference || null,
      phone: body.phone || null,
      website: body.website || null,
      openingHours: body.openingHours || null,
      isOpen: body.isOpen || null,
      priceLevel: body.priceLevel || null,
      reviews: Array.isArray(body.reviews) ? body.reviews.slice(0, 5) : [], // Limit reviews to avoid large documents
      createdAt: new Date().toISOString(),
    }

    console.log("[v0] Inserting sanitized place into MongoDB")
    const result = await db.collection("places").insertOne(sanitizedPlace)
    console.log("[v0] Place saved successfully with ID:", result.insertedId)

    return NextResponse.json(
      {
        place: { ...sanitizedPlace, _id: result.insertedId },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error saving place - Full error:", error)
    console.error("[v0] Error name:", error instanceof Error ? error.name : "Unknown")
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] MONGODB_URI exists:", !!process.env.MONGODB_URI)
    return NextResponse.json(
      {
        error: "Failed to save place",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE place
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("id")

    if (!placeId) {
      return NextResponse.json({ error: "Place ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("travel-planner")

    await db.collection("places").deleteOne({ id: placeId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting place:", error)
    return NextResponse.json({ error: "Failed to delete place" }, { status: 500 })
  }
}
