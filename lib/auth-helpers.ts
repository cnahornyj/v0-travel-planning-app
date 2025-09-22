import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import type { NextRequest } from "next/server"

export async function getAuthenticatedUser(request?: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
}

export function createAuthResponse(message: string, status = 401) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
