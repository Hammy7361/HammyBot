import { NextResponse } from "next/server"

// Mark this route as dynamic to prevent static generation
export const dynamic = "force-dynamic"

export async function GET(request) {
  // Redirect to the Discord callback handler
  const url = new URL(request.url)
  const redirectUrl = new URL("/api/auth/callback/discord", url.origin)

  // Preserve any query parameters
  url.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.append(key, value)
  })

  return NextResponse.redirect(redirectUrl)
}
