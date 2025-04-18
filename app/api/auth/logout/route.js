import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // Clear the auth cookie
  cookies().delete("discord_auth")

  return NextResponse.json({ success: true })
}
