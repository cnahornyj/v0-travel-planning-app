import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const sitePassword = process.env.SITE_PASSWORD

    if (!sitePassword) {
      return NextResponse.json({ error: "Site password not configured" }, { status: 500 })
    }

    const success = password === sitePassword

    return NextResponse.json({ success })
  } catch (error) {
    console.error("[v0] Error verifying password:", error)
    return NextResponse.json({ error: "Failed to verify password" }, { status: 500 })
  }
}
