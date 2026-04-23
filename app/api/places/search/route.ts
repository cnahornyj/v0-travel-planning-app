import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    // Using Places API (New) - Text Search endpoint
    const url = "https://places.googleapis.com/v1/places:searchText"

    const requestBody: any = {
      textQuery: query,
      maxResultCount: 10,
    }

    // Add location bias if coordinates provided
    if (lat && lng) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          },
          radius: 50000.0,
        },
      }
    }

    // Field mask is required for the new API - requesting fields we need
    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.rating",
      "places.types",
      "places.photos",
      "places.currentOpeningHours",
      "places.regularOpeningHours",
      "places.websiteUri",
      "places.nationalPhoneNumber",
      "places.priceLevel",
    ].join(",")

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (data.error) {
      console.error("[v0] Places search error:", data.error)
      return NextResponse.json({ error: data.error.message || "Search failed" }, { status: data.error.code || 500 })
    }

    const places = (data.places || []).map((place: any) => ({
      id: place.id || `place-${Math.random().toString(36).slice(2)}`,
      name: place.displayName?.text || "Unknown Place",
      address: place.formattedAddress || "Address not available",
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      type: place.types?.[0],
      rating: place.rating,
      photos: place.photos
        ? place.photos.slice(0, 5).map(
            (photo: any) =>
              `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${apiKey}`
          )
        : [],
      isOpen: place.currentOpeningHours?.openNow,
      // New API returns more details in search results
      website: place.websiteUri,
      phone: place.nationalPhoneNumber,
      priceLevel: place.priceLevel,
      openingHours: place.regularOpeningHours
        ? {
            weekdayText: place.regularOpeningHours.weekdayDescriptions || [],
          }
        : null,
    }))

    return NextResponse.json({ places })
  } catch (error) {
    console.error("[v0] Places search error:", error)
    return NextResponse.json({ error: "Failed to search places" }, { status: 500 })
  }
}
