import { discordRequest } from "./discord"
import prisma from "./db"

// Set up starboard configuration for a guild
export async function setStarboardConfig(guildId, channelId, threshold = 3, emoji = "⭐") {
  try {
    await prisma.starboardConfig.upsert({
      where: { guildId },
      update: { channelId, threshold, emoji },
      create: { guildId, channelId, threshold, emoji },
    })
    return true
  } catch (error) {
    console.error("Error setting starboard config:", error)
    return false
  }
}

// Get starboard configuration for a guild
export async function getStarboardConfig(guildId) {
  try {
    const config = await prisma.starboardConfig.findUnique({
      where: { guildId },
    })
    return config
  } catch (error) {
    console.error("Error getting starboard config:", error)
    return null
  }
}

// Disable starboard for a guild
export async function disableStarboard(guildId) {
  try {
    const result = await prisma.starboardConfig
      .delete({
        where: { guildId },
      })
      .catch(() => null)

    return !!result
  } catch (error) {
    console.error("Error disabling starboard:", error)
    return false
  }
}

// Add or update a starred message
export async function updateStarredMessage(guildId, channelId, messageId, authorId, content, stars) {
  try {
    const message = await prisma.starboardMessage.upsert({
      where: {
        guildId_messageId: {
          guildId,
          messageId,
        },
      },
      update: { stars },
      create: {
        guildId,
        channelId,
        messageId,
        authorId,
        content,
        stars,
      },
    })
    return message
  } catch (error) {
    console.error("Error updating starred message:", error)
    return null
  }
}

// Set the starboard message ID for a starred message
export async function setStarboardMessageId(guildId, messageId, starboardMessageId) {
  try {
    await prisma.starboardMessage.update({
      where: {
        guildId_messageId: {
          guildId,
          messageId,
        },
      },
      data: { starboardMessageId },
    })
    return true
  } catch (error) {
    console.error("Error setting starboard message ID:", error)
    return false
  }
}

// Get a starred message
export async function getStarredMessage(guildId, messageId) {
  try {
    const message = await prisma.starboardMessage.findUnique({
      where: {
        guildId_messageId: {
          guildId,
          messageId,
        },
      },
    })
    return message
  } catch (error) {
    console.error("Error getting starred message:", error)
    return null
  }
}

// Create a starboard embed
export function createStarboardEmbed(message, stars, emoji) {
  return {
    author: {
      name: message.author.username,
      icon_url: message.author.avatar
        ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`,
    },
    description: message.content,
    fields: [],
    footer: {
      text: `${stars} ${emoji} | Message ID: ${message.id}`,
    },
    timestamp: message.timestamp,
    color: 0xffd700, // Gold color
  }
}

// Process a reaction add event for starboard
export async function processStarboardReaction(guildId, channelId, messageId, emoji, userId) {
  try {
    // Get starboard config
    const config = await getStarboardConfig(guildId)
    if (!config) return false // Starboard not configured

    // Check if this is the starboard emoji
    if (emoji.name !== config.emoji) return false

    // Get the message
    const messageResponse = await discordRequest(`channels/${channelId}/messages/${messageId}`, {
      method: "GET",
    })

    if (!messageResponse.ok) return false

    const message = await messageResponse.json()

    // Don't star messages from the starboard channel
    if (channelId === config.channelId) return false

    // Don't star bot messages
    if (message.author.bot) return false

    // Get reaction count
    const reactionsResponse = await discordRequest(
      `channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(config.emoji)}`,
      { method: "GET" },
    )

    if (!reactionsResponse.ok) return false

    const reactions = await reactionsResponse.json()
    const stars = reactions.length

    // Update the starred message in the database
    const starredMessage = await updateStarredMessage(
      guildId,
      channelId,
      messageId,
      message.author.id,
      message.content,
      stars,
    )

    // If we haven't reached the threshold, don't post to starboard
    if (stars < config.threshold) return false

    // Create the starboard embed
    const embed = createStarboardEmbed(message, stars, config.emoji)

    // Add image if there is one
    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0]
      if (attachment.content_type && attachment.content_type.startsWith("image/")) {
        embed.image = { url: attachment.url }
      }
    }

    // Check if we already have a starboard message
    if (starredMessage && starredMessage.starboardMessageId) {
      // Update existing starboard message
      await discordRequest(`channels/${config.channelId}/messages/${starredMessage.starboardMessageId}`, {
        method: "PATCH",
        body: JSON.stringify({
          embeds: [embed],
        }),
      })
    } else {
      // Create new starboard message
      const starboardResponse = await discordRequest(`channels/${config.channelId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: `${config.emoji} **${stars}** <#${channelId}>`,
          embeds: [embed],
        }),
      })

      if (starboardResponse.ok) {
        const starboardMessage = await starboardResponse.json()
        await setStarboardMessageId(guildId, messageId, starboardMessage.id)
      }
    }

    return true
  } catch (error) {
    console.error("Error processing starboard reaction:", error)
    return false
  }
}
