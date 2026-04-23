import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get("placeId")

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }

  if (!placeId) {
    return NextResponse.json({ error: "placeId parameter is required" }, { status: 400 })
  }

  try {
    // Using Places API (New) - Place Details endpoint
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`

    // Field mask is required for the new API
    const fieldMask = [
      "id",
      "displayName",
      "formattedAddress",
      "location",
      "rating",
      "types",
      "photos",
      "currentOpeningHours",
      "regularOpeningHours",
      "nationalPhoneNumber",
      "internationalPhoneNumber",
      "websiteUri",
      "priceLevel",
      "reviews",
      "userRatingCount",
      "googleMapsUri",
      "editorialSummary",
    ].join(",")

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
    })

    const data = await response.json()

    if (data.error) {
      console.error("[v0] Place details error:", data.error)
      return NextResponse.json({ error: data.error.message || "Failed to get details" }, { status: data.error.code || 500 })
    }

    const place = data
    const result = {
      id: place.id,
      name: place.displayName?.text || "Unknown Place",
      address: place.formattedAddress || "Address not available",
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      type: place.types?.[0],
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      photos: place.photos
        ? place.photos.slice(0, 5).map(
            (photo: any) =>
              `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${apiKey}`
          )
        : [],
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
      website: place.websiteUri,
      priceLevel: place.priceLevel,
      isOpen: place.currentOpeningHours?.openNow,
      openingHours: place.regularOpeningHours
        ? {
            weekdayText: place.regularOpeningHours.weekdayDescriptions || [],
          }
        : null,
      reviews: (place.reviews || []).slice(0, 5).map((review: any) => ({
        authorName: review.authorAttribution?.displayName || "Anonymous",
        rating: review.rating,
        text: review.text?.text || "",
        relativeTimeDescription: review.relativePublishTimeDescription,
      })),
      googleMapsUrl: place.googleMapsUri,
      editorialSummary: place.editorialSummary?.text,
    }

    return NextResponse.json({ place: result })
  } catch (error) {
    console.error("[v0] Place details error:", error)
    return NextResponse.json({ error: "Failed to get place details" }, { status: 500 })
  }
}
