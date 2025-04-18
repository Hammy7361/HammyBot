import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const authCookie = cookies().get("discord_auth")

  if (!authCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const authData = JSON.parse(authCookie.value)

    // Check if the token is expired
    if (authData.expires_at < Date.now()) {
      // Token is expired, clear the cookie
      cookies().delete("discord_auth")
      return NextResponse.json({ authenticated: false, reason: "expired" }, { status: 401 })
    }

    // Return basic user info
    return NextResponse.json({
      authenticated: true,
      user: {
        id: authData.user.id,
        username: authData.user.username,
        avatar: authData.user.avatar,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ authenticated: false, reason: "invalid" }, { status: 401 })
  }
}
