import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// GET all trips
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("travel-planner")
    const trips = await db.collection("trips").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("[v0] Error fetching trips:", error)
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
  }
}

// POST create new trip
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db("travel-planner")

    const newTrip = {
      ...body,
      createdAt: new Date().toISOString(),
    }

    const result = await db.collection("trips").insertOne(newTrip)

    return NextResponse.json(
      {
        trip: { ...newTrip, _id: result.insertedId },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating trip:", error)
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
  }
}
