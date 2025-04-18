const crypto = require("crypto")
const prisma = require("../../lib/db/prismaClient")
const { findGithubWebhook } = require("../../bot/services/github")
const { createGithubEventEmbed } = require("../../bot/utils/github")
const { client } = require("../../bot")

// GitHub webhook handler
module.exports = async (req, res) => {
  try {
    // Verify the GitHub webhook signature
    const signature = req.headers["x-hub-signature-256"]
    if (!signature) {
      console.error("Missing GitHub webhook signature")
      return res.status(401).json({ error: "Unauthorized" })
    }

    // Get the raw body
    const rawBody = JSON.stringify(req.body)

    // Verify the signature
    const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET || "")
    const digest = `sha256=${hmac.update(rawBody).digest("hex")}`

    if (signature !== digest) {
      console.error("Invalid GitHub webhook signature")
      return res.status(401).json({ error: "Unauthorized" })
    }

    // Get the event type
    const event = req.headers["x-github-event"]
    if (!event) {
      console.error("Missing GitHub event type")
      return res.status(400).json({ error: "Missing event type" })
    }

    // Get the repository name
    const repository = req.body.repository?.full_name
    if (!repository) {
      console.error("Missing repository information")
      return res.status(400).json({ error: "Missing repository information" })
    }

    // Find the webhook configuration for this repository
    const webhookConfig = await findGithubWebhook(repository)
    if (!webhookConfig) {
      console.log(`No webhook configuration found for repository: ${repository}`)
      return res.status(200).json({ message: "No webhook configuration found for this repository" })
    }

    // Check if this event type should be processed
    const { guildId, channelId, events } = webhookConfig
    if (events !== "all" && !events.split(",").includes(event)) {
      console.log(`Event type ${event} is not configured for repository ${repository}`)
      return res.status(200).json({ message: "Event type not configured for this repository" })
    }

    try {
      // Try to create an embed for the event
      const embed = createGithubEventEmbed(event, req.body)

      // Try to send the embed to the configured channel
      const guild = client.guilds.cache.get(guildId)
      if (!guild) {
        throw new Error(`Bot is not in guild ${guildId}`)
      }

      const channel = guild.channels.cache.get(channelId)
      if (!channel) {
        throw new Error(`Channel ${channelId} not found in guild ${guildId}`)
      }

      await channel.send({ embeds: [embed] })
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error("Error sending Discord message, storing event for later processing:", error)

      // If we can't send the message (likely due to a deployment/restart),
      // store the event in the database for later processing
      await prisma.pendingGithubEvent.create({
        data: {
          repository,
          eventType: event,
          payload: JSON.stringify(req.body),
          processed: false,
        },
      })

      return res.status(200).json({
        success: true,
        message: "Event stored for later processing",
      })
    }
  } catch (error) {
    console.error("Error processing GitHub webhook:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
