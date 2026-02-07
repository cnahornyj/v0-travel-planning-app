import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get("input")

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }

  if (!input) {
    return NextResponse.json({ error: "Input parameter is required" }, { status: 400 })
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[v0] Autocomplete error:", data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || "Autocomplete failed" }, { status: 500 })
    }

    const predictions = (data.predictions || []).map((prediction: any) => ({
      placeId: prediction.place_id,
      mainText: prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || "",
      description: prediction.description,
    }))

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error("[v0] Autocomplete error:", error)
    return NextResponse.json({ error: "Failed to get autocomplete results" }, { status: 500 })
  }
}
