import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// GET all saved places
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("travel-planner")
    const places = await db.collection("places").find({}).toArray()

    console.log("[v0] GET places - Total places:", places.length)
    if (places.length > 0) {
      console.log("[v0] GET places - First place structure:", {
        id: places[0].id,
        name: places[0].name,
        hasUserImages: !!places[0].userImages,
        userImagesCount: places[0].userImages?.length || 0,
        userImages: places[0].userImages,
      })
    }

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

// PATCH handler to use upsert - creates place if it doesn't exist
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("id")
    const body = await request.json()

    console.log("[v0] PATCH request received for place ID:", placeId)
    console.log("[v0] PATCH body userImages:", body.userImages)

    if (!placeId || placeId === "undefined") {
      console.error("[v0] Invalid place ID provided:", placeId)
      return NextResponse.json({ error: "Valid place ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("travel-planner")

    // Check if place exists
    const existingPlace = await db.collection("places").findOne({ id: placeId })
    console.log("[v0] Existing place found:", !!existingPlace)

    if (!existingPlace) {
      console.log("[v0] Place not found, creating new place with images")

      if (!body.place) {
        return NextResponse.json({ error: "Place data required for new place" }, { status: 400 })
      }

      const newPlace = {
        id: placeId,
        name: body.place.name || "",
        address: body.place.address || "",
        lat: body.place.lat || 0,
        lng: body.place.lng || 0,
        type: body.place.type || null,
        rating: body.place.rating || null,
        photos: Array.isArray(body.place.photos) ? body.place.photos : [],
        userImages: Array.isArray(body.userImages) ? body.userImages : [],
        saved: true,
        notes: body.place.notes || "",
        tags: Array.isArray(body.place.tags) ? body.place.tags : [],
        visitPreference: body.place.visitPreference || null,
        phone: body.place.phone || null,
        website: body.place.website || null,
        openingHours: body.place.openingHours || null,
        isOpen: body.place.isOpen || null,
        priceLevel: body.place.priceLevel || null,
        reviews: Array.isArray(body.place.reviews) ? body.place.reviews.slice(0, 5) : [],
        createdAt: new Date().toISOString(),
      }

      console.log("[v0] Creating new place with userImages:", newPlace.userImages)
      await db.collection("places").insertOne(newPlace)
      console.log("[v0] New place created successfully")
      return NextResponse.json({ success: true })
    }

    const updateData: any = {}
    if (body.userImages !== undefined) {
      updateData.userImages = body.userImages
      console.log("[v0] Updating userImages to:", body.userImages)
    }

    const result = await db.collection("places").updateOne({ id: placeId }, { $set: updateData })

    console.log("[v0] Update result - matched:", result.matchedCount, "modified:", result.modifiedCount)

    // Verify the update by fetching the place again
    const updatedPlace = await db.collection("places").findOne({ id: placeId })
    console.log("[v0] After update - userImages:", updatedPlace?.userImages)

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
