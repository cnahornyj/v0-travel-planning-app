import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// GET all saved places
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("travel-planner")
    const places = await db.collection("places").find({}).toArray()

    console.log("[v0] GET places - First place from DB:", places[0])
    console.log("[v0] GET places - Total places:", places.length)

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
      reviews: Array.isArray(body.reviews) ? body.reviews.slice(0, 5) : [],
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

// PATCH handler to update place images
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("id")
    const body = await request.json()

    console.log("[v0] PATCH request received for place ID:", placeId)

    if (!placeId || placeId === "undefined") {
      console.error("[v0] Invalid place ID provided:", placeId)
      return NextResponse.json({ error: "Valid place ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("travel-planner")

    const updateData: any = {}
    if (body.userImages !== undefined) {
      updateData.userImages = body.userImages
    }

    const result = await db.collection("places").updateOne({ id: placeId }, { $set: updateData })

    console.log("[v0] Update result:", result.modifiedCount, "document(s) modified")

    if (result.matchedCount === 0) {
      console.warn("[v0] No place found with ID:", placeId)
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating place:", error)
    return NextResponse.json({ error: "Failed to update place" }, { status: 500 })
  }
}

// DELETE place
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("id")

    console.log("[v0] DELETE request received for place ID:", placeId)

    if (!placeId || placeId === "undefined") {
      console.error("[v0] Invalid place ID provided:", placeId)
      return NextResponse.json({ error: "Valid place ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("travel-planner")

    const result = await db.collection("places").deleteOne({ id: placeId })
    console.log("[v0] Delete result:", result.deletedCount, "document(s) deleted")

    if (result.deletedCount === 0) {
      console.warn("[v0] No place found with ID:", placeId)
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting place:", error)
    return NextResponse.json({ error: "Failed to delete place" }, { status: 500 })
  }
}
