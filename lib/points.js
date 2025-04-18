import prisma from "./db"
import { discordRequest } from "./discord"

// Get points for a user in a guild
export async function getUserPoints(guildId, userId) {
  try {
    const userPoints = await prisma.userPoints.findUnique({
      where: {
        guildId_userId: {
          guildId,
          userId,
        },
      },
    })

    return userPoints?.points || 0
  } catch (error) {
    console.error("Error getting user points:", error)
    return 0
  }
}

// Set points for a user in a guild
export async function setUserPoints(guildId, userId, points) {
  try {
    const userPoints = await prisma.userPoints.upsert({
      where: {
        guildId_userId: {
          guildId,
          userId,
        },
      },
      update: { points },
      create: {
        guildId,
        userId,
        points,
      },
    })

    return userPoints
  } catch (error) {
    console.error("Error setting user points:", error)
    return null
  }
}

// Increase points for a user in a guild
export async function increaseUserPoints(guildId, userId, amount = 1) {
  try {
    const currentPoints = await getUserPoints(guildId, userId)
    return await setUserPoints(guildId, userId, currentPoints + amount)
  } catch (error) {
    console.error("Error increasing user points:", error)
    return null
  }
}

// Decrease points for a user in a guild
export async function decreaseUserPoints(guildId, userId, amount = 1) {
  try {
    const currentPoints = await getUserPoints(guildId, userId)
    const newPoints = Math.max(0, currentPoints - amount) // Prevent negative points
    return await setUserPoints(guildId, userId, newPoints)
  } catch (error) {
    console.error("Error decreasing user points:", error)
    return null
  }
}

// Reset points for a user in a guild
export async function resetUserPoints(guildId, userId) {
  try {
    return await setUserPoints(guildId, userId, 0)
  } catch (error) {
    console.error("Error resetting user points:", error)
    return null
  }
}

// Reset all points in a guild
export async function resetAllPoints(guildId) {
  try {
    const { count } = await prisma.userPoints.deleteMany({
      where: { guildId },
    })
    return count
  } catch (error) {
    console.error("Error resetting all points:", error)
    return 0
  }
}

// Get top users by points in a guild
export async function getLeaderboard(guildId, limit = 10) {
  try {
    const leaderboard = await prisma.userPoints.findMany({
      where: { guildId },
      orderBy: { points: "desc" },
      take: limit,
    })

    return leaderboard
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    return []
  }
}

// Get points for users with a specific role
export async function getPointsByRole(guildId, roleId) {
  try {
    // First, get all members with the role
    const membersResponse = await discordRequest(`guilds/${guildId}/members?limit=1000`, {
      method: "GET",
    })

    if (!membersResponse.ok) {
      throw new Error("Failed to fetch guild members")
    }

    const members = await membersResponse.json()

    // Filter members who have the role
    const membersWithRole = members.filter((member) => member.roles && member.roles.includes(roleId))

    if (membersWithRole.length === 0) {
      return []
    }

    // Get points for these members
    const userIds = membersWithRole.map((member) => member.user.id)

    const pointsData = await prisma.userPoints.findMany({
      where: {
        guildId,
        userId: { in: userIds },
      },
      orderBy: { points: "desc" },
    })

    return pointsData
  } catch (error) {
    console.error("Error getting points by role:", error)
    return []
  }
}

// Check if a user has permission to manage points
export async function canManagePoints(guildId, userId) {
  try {
    // Get the member's roles
    const memberResponse = await discordRequest(`guilds/${guildId}/members/${userId}`, {
      method: "GET",
    })

    if (!memberResponse.ok) {
      return false
    }

    const member = await memberResponse.json()

    // Check if the user is the server owner
    const guildResponse = await discordRequest(`guilds/${guildId}`, {
      method: "GET",
    })

    if (guildResponse.ok) {
      const guild = await guildResponse.json()
      if (guild.owner_id === userId) {
        return true
      }
    }

    // Check if the user has administrator permission
    // First check if they have the ADMINISTRATOR permission flag in their permissions
    if (member.permissions && member.permissions.includes("ADMINISTRATOR")) {
      return true
    }

    // Also check the numeric permission value for the Administrator bit (0x8)
    if (member.permissions) {
      try {
        // Convert to BigInt if it's a string, or use as is if it's already a number
        const permValue = typeof member.permissions === "string" ? BigInt(member.permissions) : member.permissions

        // Check if the Administrator bit (0x8) is set
        if ((permValue & BigInt(0x8)) === BigInt(0x8)) {
          return true
        }
      } catch (e) {
        console.error("Error checking numeric permissions:", e)
        // Continue to check roles if there's an error with the numeric check
      }
    }

    // Get the points config to check moderator roles
    const config = await prisma.pointsConfig.findUnique({
      where: { guildId },
    })

    if (!config || !config.moderatorRoles.length) {
      // If no config or no moderator roles defined, only admins can manage points
      // But we already checked for admin above, so return false
      return false
    }

    // Check if the user has any of the moderator roles
    return member.roles.some((role) => config.moderatorRoles.includes(role))
  } catch (error) {
    console.error("Error checking points permission:", error)
    return false
  }
}
