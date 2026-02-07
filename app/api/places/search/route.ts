import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`

    if (lat && lng) {
      url += `&location=${lat},${lng}&radius=50000`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[v0] Places search error:", data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || "Search failed" }, { status: 500 })
    }

    const places = (data.results || []).slice(0, 10).map((place: any) => ({
      id: place.place_id || `place-${Math.random().toString(36).slice(2)}`,
      name: place.name || "Unknown Place",
      address: place.formatted_address || "Address not available",
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
      type: place.types?.[0],
      rating: place.rating,
      photos: place.photos
        ? place.photos.slice(0, 5).map(
            (photo: any) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${apiKey}`
          )
        : [],
      isOpen: place.opening_hours?.open_now,
    }))

    return NextResponse.json({ places })
  } catch (error) {
    console.error("[v0] Places search error:", error)
    return NextResponse.json({ error: "Failed to search places" }, { status: 500 })
  }
}
