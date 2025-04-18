import { verifyKey } from "discord-interactions"

// Verify that the request is coming from Discord
export async function verifyDiscordRequest(request) {
  try {
    const signature = request.headers.get("x-signature-ed25519")
    const timestamp = request.headers.get("x-signature-timestamp")

    if (!signature || !timestamp) {
      console.error("Missing signature or timestamp headers")
      return { isValid: false, body: null }
    }

    const body = await request.text()

    if (!body) {
      console.error("Empty request body")
      return { isValid: false, body: null }
    }

    const isValidRequest = verifyKey(body, signature, timestamp, process.env.DISCORD_PUBLIC_KEY)

    if (!isValidRequest) {
      console.error("Invalid request signature")
      return { isValid: false, body: null }
    }

    let parsedBody
    try {
      parsedBody = JSON.parse(body)
    } catch (error) {
      console.error("Error parsing request body:", error)
      return { isValid: false, body: null }
    }

    return { isValid: true, body: parsedBody }
  } catch (error) {
    console.error("Error in verifyDiscordRequest:", error)
    return { isValid: false, body: null }
  }
}
