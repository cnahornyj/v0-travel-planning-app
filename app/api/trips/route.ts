import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// GET all trips
export async function GET() {
  try {
    console.log("[v0] Attempting to connect to MongoDB...")
    const client = await clientPromise
    console.log("[v0] MongoDB connected successfully")

    const db = client.db("travel-planner")
    const trips = await db.collection("trips").find({}).sort({ createdAt: -1 }).toArray()
    console.log("[v0] Fetched trips:", trips.length)

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("[v0] Error fetching trips:", error)
    console.error("[v0] Error details:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        error: "Failed to fetch trips",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// POST create new trip
export async function POST(request: Request) {
  try {
    console.log("[v0] Attempting to create trip...")
    const body = await request.json()
    console.log("[v0] Request body:", JSON.stringify(body, null, 2))

    console.log("[v0] Connecting to MongoDB...")
    const client = await clientPromise
    console.log("[v0] MongoDB connected successfully")

    const db = client.db("travel-planner")

    const newTrip = {
      ...body,
      createdAt: new Date().toISOString(),
    }

    console.log("[v0] Inserting trip into database...")
    const result = await db.collection("trips").insertOne(newTrip)
    console.log("[v0] Trip created with ID:", result.insertedId)

    return NextResponse.json(
      {
        trip: { ...newTrip, _id: result.insertedId },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating trip:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] MONGODB_URI exists:", !!process.env.MONGODB_URI)
    return NextResponse.json(
      {
        error: "Failed to create trip",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
