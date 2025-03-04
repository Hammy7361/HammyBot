import { NextResponse } from "next/server"
import { findGithubWebhook, createGithubEventEmbed, discordRequest } from "../../../../lib/discord"
import crypto from "crypto"

// This endpoint receives webhook events from GitHub
export async function POST(req) {
  try {
    // Verify the GitHub webhook signature
    const signature = req.headers.get("x-hub-signature-256")
    if (!signature) {
      console.error("Missing GitHub webhook signature")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the raw body
    const rawBody = await req.text()

    // Verify the signature
    const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET || "")
    const digest = `sha256=${hmac.update(rawBody).digest("hex")}`

    if (signature !== digest) {
      console.error("Invalid GitHub webhook signature")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the body
    const body = JSON.parse(rawBody)

    // Get the event type
    const event = req.headers.get("x-github-event")
    if (!event) {
      console.error("Missing GitHub event type")
      return NextResponse.json({ error: "Missing event type" }, { status: 400 })
    }

    // Get the repository name
    const repository = body.repository?.full_name
    if (!repository) {
      console.error("Missing repository information")
      return NextResponse.json({ error: "Missing repository information" }, { status: 400 })
    }

    // Find the webhook configuration for this repository
    const webhookConfig = findGithubWebhook(repository)
    if (!webhookConfig) {
      console.log(`No webhook configuration found for repository: ${repository}`)
      return NextResponse.json({ message: "No webhook configuration found for this repository" })
    }

    // Check if this event type should be processed
    const { guildId, channelId, events } = webhookConfig
    if (events !== "all" && !events.split(",").includes(event)) {
      console.log(`Event type ${event} is not configured for repository ${repository}`)
      return NextResponse.json({ message: "Event type not configured for this repository" })
    }

    // Create an embed for the event
    const embed = createGithubEventEmbed(event, body)

    // Send the embed to the configured channel
    await discordRequest(`channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing GitHub webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

