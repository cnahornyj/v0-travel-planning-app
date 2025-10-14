import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if user is authenticated
  const authCookie = request.cookies.get("site-auth")
  const isAuthPage = request.nextUrl.pathname === "/auth"

  // If authenticated and trying to access auth page, redirect to home
  if (authCookie?.value === "authenticated" && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If not authenticated and not on auth page, redirect to auth
  if (authCookie?.value !== "authenticated" && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
