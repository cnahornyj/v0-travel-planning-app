import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat or lng" }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=country`
    )

    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const countryComponent = data.results[0].address_components?.find(
        (component: any) => component.types.includes("country")
      )

      if (countryComponent) {
        return NextResponse.json({
          countryCode: countryComponent.short_name,
          countryName: countryComponent.long_name,
        })
      }
    }

    return NextResponse.json({ error: "Country not found" }, { status: 404 })
  } catch (error) {
    console.error("Error fetching country:", error)
    return NextResponse.json({ error: "Failed to fetch country" }, { status: 500 })
  }
}
