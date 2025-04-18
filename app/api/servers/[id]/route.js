import { NextResponse } from "next/server"
import prisma from "../../../../lib/db"
import { discordRequest } from "../../../../lib/discord"

// Get server settings
export async function GET(req, { params }) {
  try {
    const { id } = params

    // Verify user has access to this server
    // This would require session management

    // Get server details from Discord
    const serverResponse = await discordRequest(`guilds/${id}`, {
      method: "GET",
    })

    if (!serverResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch server" }, { status: 404 })
    }

    const serverData = await serverResponse.json()

    // Get bot settings from database
    const loggingChannel = await prisma.loggingChannel.findUnique({
      where: { guildId: id },
    })

    const starboardConfig = await prisma.starboardConfig.findUnique({
      where: { guildId: id },
    })

    // Get verification role
    const verificationRole = await prisma.verificationRole.findUnique({
      where: { guildId: id },
    })

    // Get GitHub webhooks
    const githubWebhooks = await prisma.githubWebhook.findMany({
      where: { guildId: id },
    })

    return NextResponse.json({
      id: serverData.id,
      name: serverData.name,
      icon: serverData.icon ? `https://cdn.discordapp.com/icons/${serverData.id}/${serverData.icon}.png` : null,
      memberCount: serverData.approximate_member_count || 0,
      features: {
        logging: !!loggingChannel,
        loggingChannel: loggingChannel?.channelId,
        starboard: !!starboardConfig,
        starboardChannel: starboardConfig?.channelId,
        starboardThreshold: starboardConfig?.threshold || 3,
        starboardEmoji: starboardConfig?.emoji || "⭐",
        verification: !!verificationRole,
        verificationRole: verificationRole?.roleId,
        githubWebhooks: githubWebhooks.map((webhook) => ({
          repository: webhook.repository,
          channelId: webhook.channelId,
          events: webhook.events,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching server settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update server settings
export async function POST(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    // Verify user has access to this server
    // This would require session management

    // Update logging settings
    if (body.logging !== undefined) {
      if (body.logging && body.loggingChannel) {
        await prisma.loggingChannel.upsert({
          where: { guildId: id },
          update: { channelId: body.loggingChannel },
          create: { guildId: id, channelId: body.loggingChannel },
        })
      } else if (!body.logging) {
        await prisma.loggingChannel
          .delete({
            where: { guildId: id },
          })
          .catch(() => {}) // Ignore if not found
      }
    }

    // Update starboard settings
    if (body.starboard !== undefined) {
      if (body.starboard && body.starboardChannel) {
        await prisma.starboardConfig.upsert({
          where: { guildId: id },
          update: {
            channelId: body.starboardChannel,
            threshold: body.starboardThreshold || 3,
            emoji: body.starboardEmoji || "⭐",
          },
          create: {
            guildId: id,
            channelId: body.starboardChannel,
            threshold: body.starboardThreshold || 3,
            emoji: body.starboardEmoji || "⭐",
          },
        })
      } else if (!body.starboard) {
        await prisma.starboardConfig
          .delete({
            where: { guildId: id },
          })
          .catch(() => {}) // Ignore if not found
      }
    }

    // Update verification settings
    if (body.verification !== undefined) {
      if (body.verification && body.verificationRole) {
        await prisma.verificationRole.upsert({
          where: { guildId: id },
          update: { roleId: body.verificationRole },
          create: { guildId: id, roleId: body.verificationRole },
        })
      } else if (!body.verification) {
        await prisma.verificationRole
          .delete({
            where: { guildId: id },
          })
          .catch(() => {}) // Ignore if not found
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating server settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
