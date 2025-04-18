import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "Discord bot API is running!",
    timestamp: new Date().toISOString(),
    env: {
      publicKeyExists: !!process.env.DISCORD_PUBLIC_KEY,
      clientIdExists: !!process.env.DISCORD_CLIENT_ID,
      botTokenExists: !!process.env.DISCORD_BOT_TOKEN,
    },
  })
}
