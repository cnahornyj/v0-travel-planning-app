import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

// PATCH update trip
export async function PATCH(request: Request, { params }: { params: { tripId: string } }) {
  try {
    const tripId = params.tripId

    if (!tripId || tripId === "undefined") {
      console.error("[v0] Invalid trip ID:", tripId)
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("[v0] Updating trip:", tripId)

    const client = await clientPromise
    const db = client.db("travel-planner")

    const result = await db.collection("trips").updateOne({ _id: new ObjectId(tripId) }, { $set: body })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating trip:", error)
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 })
  }
}

// DELETE trip
export async function DELETE(request: Request, { params }: { params: { tripId: string } }) {
  try {
    const tripId = params.tripId

    if (!tripId || tripId === "undefined") {
      console.error("[v0] Invalid trip ID:", tripId)
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    console.log("[v0] Deleting trip:", tripId)

    const client = await clientPromise
    const db = client.db("travel-planner")

    const result = await db.collection("trips").deleteOne({ _id: new ObjectId(tripId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting trip:", error)
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 })
  }
}
