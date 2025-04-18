import prisma from "../db/prismaClient"

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

// Rest of the file remains the same...
