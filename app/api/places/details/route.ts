import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get("placeId")

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }

  if (!placeId) {
    return NextResponse.json({ error: "placeId parameter is required" }, { status: 400 })
  }

  try {
    const fields = [
      "place_id",
      "name",
      "formatted_address",
      "geometry",
      "rating",
      "types",
      "photos",
      "opening_hours",
      "formatted_phone_number",
      "website",
      "price_level",
      "reviews",
    ].join(",")

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== "OK") {
      console.error("[v0] Place details error:", data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || "Failed to get details" }, { status: 500 })
    }

    const place = data.result
    const result = {
      id: place.place_id,
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
      phone: place.formatted_phone_number,
      website: place.website,
      priceLevel: place.price_level,
      isOpen: place.opening_hours?.open_now,
      openingHours: place.opening_hours
        ? {
            weekdayText: place.opening_hours.weekday_text || [],
          }
        : null,
      reviews: (place.reviews || []).slice(0, 5).map((review: any) => ({
        authorName: review.author_name,
        rating: review.rating,
        text: review.text,
        relativeTimeDescription: review.relative_time_description,
      })),
    }

    return NextResponse.json({ place: result })
  } catch (error) {
    console.error("[v0] Place details error:", error)
    return NextResponse.json({ error: "Failed to get place details" }, { status: 500 })
  }
}
