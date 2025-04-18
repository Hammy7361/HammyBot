import { NextResponse } from "next/server"
import { verifyDiscordRequest } from "../../../../lib/discord"
import { processStarboardReaction } from "../../../../lib/starboard"

// This endpoint handles message reactions for the starboard
export async function POST(req) {
  try {
    // Clone the request for verification
    const reqClone = req.clone()

    // Verify the request is from Discord
    const { isValid, body } = await verifyDiscordRequest(reqClone)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid request" }, { status: 401 })
    }

    // Check if this is a MESSAGE_REACTION_ADD event
    if (body.type !== 0 || body.t !== "MESSAGE_REACTION_ADD") {
      return NextResponse.json({ message: "Not a reaction add event" })
    }

    const { d: data } = body

    // Ignore DM reactions
    if (!data.guild_id) {
      return NextResponse.json({ message: "Not a guild reaction" })
    }

    // Process the reaction for starboard
    await processStarboardReaction(data.guild_id, data.channel_id, data.message_id, data.emoji, data.user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing reaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
