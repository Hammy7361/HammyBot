import prisma from "./db"
import { findGithubWebhook, createGithubEventEmbed, discordRequest } from "./discord"

// Process any pending GitHub events that were received during deployment
export async function processPendingGithubEvents() {
  try {
    console.log("Checking for pending GitHub events...")

    // Get all unprocessed events
    const pendingEvents = await prisma.pendingGithubEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: "asc" },
      take: 50, // Process in batches if there are many
    })

    if (pendingEvents.length === 0) {
      console.log("No pending GitHub events found")
      return
    }

    console.log(`Found ${pendingEvents.length} pending GitHub events to process`)

    for (const event of pendingEvents) {
      try {
        // Find the webhook configuration for this repository
        const webhookConfig = await findGithubWebhook(event.repository)

        if (!webhookConfig) {
          console.log(`No webhook configuration found for repository: ${event.repository}`)
          // Mark as processed since we can't do anything with it
          await prisma.pendingGithubEvent.update({
            where: { id: event.id },
            data: { processed: true },
          })
          continue
        }

        // Check if this event type should be processed
        const { guildId, channelId, events } = webhookConfig
        if (events !== "all" && !events.split(",").includes(event.eventType)) {
          console.log(`Event type ${event.eventType} is not configured for repository ${event.repository}`)
          // Mark as processed since it's not configured to be sent
          await prisma.pendingGithubEvent.update({
            where: { id: event.id },
            data: { processed: true },
          })
          continue
        }

        // Parse the payload
        const payload = JSON.parse(event.payload)

        // Create an embed for the event
        const embed = createGithubEventEmbed(event.eventType, payload)

        // Send the embed to the configured channel
        await discordRequest(`channels/${channelId}/messages`, {
          method: "POST",
          body: JSON.stringify({
            embeds: [embed],
          }),
        })

        // Mark as processed
        await prisma.pendingGithubEvent.update({
          where: { id: event.id },
          data: { processed: true },
        })

        console.log(`Processed pending GitHub event: ${event.id} for ${event.repository}`)
      } catch (error) {
        console.error(`Error processing pending GitHub event ${event.id}:`, error)
        // We don't mark as processed so it will be retried next time
      }
    }

    console.log("Finished processing pending GitHub events")
  } catch (error) {
    console.error("Error in processPendingGithubEvents:", error)
  }
}
