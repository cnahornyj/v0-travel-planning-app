import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    const correctPassword = process.env.SITE_PASSWORD

    if (!correctPassword) {
      return NextResponse.json({ success: false, message: "Password not configured" }, { status: 500 })
    }

    if (password === correctPassword) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: "Incorrect password" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
