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
    const client = await clientPromise
    const db = client.db("travel-planner")

    // Check if place already exists
    const existing = await db.collection("places").findOne({ id: body.id })
    if (existing) {
      return NextResponse.json({ place: existing })
    }

    const result = await db.collection("places").insertOne(body)

    return NextResponse.json(
      {
        place: { ...body, _id: result.insertedId },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error saving place:", error)
    return NextResponse.json({ error: "Failed to save place" }, { status: 500 })
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
