import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }

  const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places${mapId ? `&map_ids=${mapId}` : ""}`

  return NextResponse.json({ scriptUrl })
}
