import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("[v0] Testing MongoDB connection...")
    console.log("[v0] MONGODB_URI exists:", !!process.env.MONGODB_URI)

    // Test connection
    const client = await clientPromise
    console.log("[v0] Client connected successfully")

    // Test database access
    const db = client.db("travel-planner")
    console.log("[v0] Database accessed:", db.databaseName)

    // Test collection access
    const collections = await db.listCollections().toArray()
    console.log("[v0] Collections found:", collections.length)

    // Try a simple operation
    const tripsCollection = db.collection("trips")
    const count = await tripsCollection.countDocuments()
    console.log("[v0] Trips count:", count)

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      database: db.databaseName,
      collections: collections.map((c) => c.name),
      tripsCount: count,
    })
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
