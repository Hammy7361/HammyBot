import { NextResponse } from "next/server"

// Mark this route as dynamic to prevent static generation
export const dynamic = "force-dynamic"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const guild_id = searchParams.get("guild_id")
  const error = searchParams.get("error")

  // If there was an error or the user canceled
  if (error) {
    console.error("Bot addition error:", error)
    return NextResponse.redirect(new URL("/dashboard/servers?error=bot_addition_canceled", request.url))
  }

  // If we have a guild_id, the bot was successfully added
  if (guild_id) {
    console.log("Bot successfully added to guild:", guild_id)
    return NextResponse.redirect(new URL(`/dashboard/server/${guild_id}?success=true`, request.url))
  }

  // Default fallback
  return NextResponse.redirect(new URL("/dashboard/servers", request.url))
}
