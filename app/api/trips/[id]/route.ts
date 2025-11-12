import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tripId } = await params
    const body = await request.json()

    console.log("[v0] PATCH request for trip ID:", tripId)

    if (!tripId || tripId === "undefined") {
      return NextResponse.json({ error: "Valid trip ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("travel-planner")

    const result = await db.collection("trips").updateOne({ _id: new ObjectId(tripId) }, { $set: body })

    console.log("[v0] Update result - matched:", result.matchedCount, "modified:", result.modifiedCount)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating trip:", error)
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tripId } = await params

    console.log("[v0] DELETE request for trip ID:", tripId)

    if (!tripId || tripId === "undefined") {
      return NextResponse.json({ error: "Valid trip ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("travel-planner")

    const result = await db.collection("trips").deleteOne({ _id: new ObjectId(tripId) })

    console.log("[v0] Delete result:", result.deletedCount, "document(s) deleted")

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting trip:", error)
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 })
  }
}
