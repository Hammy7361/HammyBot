import prisma from "./db"
import { increaseUserPoints } from "./points"

// Get XP configuration for a guild
export async function getXpConfig(guildId) {
  try {
    const config = await prisma.xpConfig.findUnique({
      where: { guildId },
    })

    if (!config) {
      // Create default config if it doesn't exist
      return prisma.xpConfig.create({
        data: {
          guildId,
          voiceXpEnabled: true,
          voiceXpPerMinute: 1,
          voiceXpCooldown: 5,
          mediaXpEnabled: true,
          mediaXpAmount: 5,
          mediaXpCooldown: 60,
          mediaChannels: [],
        },
      })
    }

    return config
  } catch (error) {
    console.error("Error getting XP config:", error)
    return null
  }
}

// Update XP configuration for a guild
export async function updateXpConfig(guildId, data) {
  try {
    return await prisma.xpConfig.upsert({
      where: { guildId },
      update: data,
      create: {
        guildId,
        ...data,
      },
    })
  } catch (error) {
    console.error("Error updating XP config:", error)
    return null
  }
}

// Start tracking a voice session
export async function startVoiceSession(guildId, userId, channelId) {
  try {
    // Check if there's already an active session
    const activeSession = await prisma.userVoiceSession.findFirst({
      where: {
        guildId,
        userId,
        leftAt: null,
      },
    })

    if (activeSession) {
      // If the user is switching channels, end the previous session
      if (activeSession.channelId !== channelId) {
        await endVoiceSession(guildId, userId, activeSession.channelId)
      } else {
        // Already tracking this session
        return activeSession
      }
    }

    // Start a new session
    return await prisma.userVoiceSession.create({
      data: {
        guildId,
        userId,
        channelId,
      },
    })
  } catch (error) {
    console.error("Error starting voice session:", error)
    return null
  }
}

// End a voice session and award XP
export async function endVoiceSession(guildId, userId, channelId) {
  try {
    // Find the active session
    const session = await prisma.userVoiceSession.findFirst({
      where: {
        guildId,
        userId,
        channelId,
        leftAt: null,
      },
    })

    if (!session) {
      console.log(`No active voice session found for user ${userId} in channel ${channelId}`)
      return null
    }

    const now = new Date()
    const joinedAt = new Date(session.joinedAt)
    const durationMs = now.getTime() - joinedAt.getTime()
    const durationSeconds = Math.floor(durationMs / 1000)

    // Update the session with end time and duration
    const updatedSession = await prisma.userVoiceSession.update({
      where: { id: session.id },
      data: {
        leftAt: now,
        duration: durationSeconds,
      },
    })

    // Award XP if enabled and session is long enough
    const config = await getXpConfig(guildId)
    if (config && config.voiceXpEnabled && durationSeconds >= 60) {
      // Only award XP if session is at least 1 minute
      const minutesInVoice = Math.floor(durationSeconds / 60)
      const xpToAward = minutesInVoice * config.voiceXpPerMinute

      if (xpToAward > 0) {
        await increaseUserPoints(guildId, userId, xpToAward)

        // Mark session as XP awarded
        await prisma.userVoiceSession.update({
          where: { id: session.id },
          data: { xpAwarded: true },
        })

        console.log(`Awarded ${xpToAward} XP to user ${userId} for ${minutesInVoice} minutes in voice`)
      }
    }

    return updatedSession
  } catch (error) {
    console.error("Error ending voice session:", error)
    return null
  }
}

// Record a media submission and award XP
export async function recordMediaSubmission(guildId, userId, channelId, messageId, mediaType) {
  try {
    // Check if this channel is configured for media XP
    const config = await getXpConfig(guildId)
    if (!config || !config.mediaXpEnabled) {
      return null
    }

    // Check if the channel is in the list of media channels
    if (config.mediaChannels.length > 0 && !config.mediaChannels.includes(channelId)) {
      return null
    }

    // Check for cooldown
    const recentSubmission = await prisma.mediaSubmission.findFirst({
      where: {
        guildId,
        userId,
        createdAt: {
          gte: new Date(Date.now() - config.mediaXpCooldown * 60 * 1000),
        },
      },
    })

    let xpAwarded = false
    let xpAmount = 0

    // If no recent submission within cooldown, award XP
    if (!recentSubmission) {
      xpAwarded = true
      xpAmount = config.mediaXpAmount
      await increaseUserPoints(guildId, userId, xpAmount)
      console.log(`Awarded ${xpAmount} XP to user ${userId} for media submission`)
    }

    // Record the submission
    return await prisma.mediaSubmission.create({
      data: {
        guildId,
        userId,
        channelId,
        messageId,
        mediaType,
        xpAwarded,
        xpAmount: xpAwarded ? xpAmount : 0,
      },
    })
  } catch (error) {
    console.error("Error recording media submission:", error)
    return null
  }
}

// Get voice time statistics for a user
export async function getUserVoiceStats(guildId, userId) {
  try {
    // Get all completed voice sessions for the user
    const sessions = await prisma.userVoiceSession.findMany({
      where: {
        guildId,
        userId,
        leftAt: { not: null },
      },
    })

    // Calculate total time
    const totalSeconds = sessions.reduce((total, session) => total + (session.duration || 0), 0)
    const totalMinutes = Math.floor(totalSeconds / 60)
    const totalHours = Math.floor(totalMinutes / 60)

    // Get current session if any
    const currentSession = await prisma.userVoiceSession.findFirst({
      where: {
        guildId,
        userId,
        leftAt: null,
      },
    })

    return {
      totalSessions: sessions.length,
      totalSeconds,
      totalMinutes,
      totalHours,
      currentSession,
    }
  } catch (error) {
    console.error("Error getting user voice stats:", error)
    return null
  }
}

// Get media submission statistics for a user
export async function getUserMediaStats(guildId, userId) {
  try {
    // Get all media submissions for the user
    const submissions = await prisma.mediaSubmission.findMany({
      where: {
        guildId,
        userId,
      },
    })

    // Calculate total XP earned from media
    const totalXp = submissions.reduce((total, submission) => total + (submission.xpAmount || 0), 0)

    return {
      totalSubmissions: submissions.length,
      totalXp,
    }
  } catch (error) {
    console.error("Error getting user media stats:", error)
    return null
  }
}
