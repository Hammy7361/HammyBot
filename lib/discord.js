import { verifyKey } from "discord-interactions"
import prisma from "./db"

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

// Make requests to Discord API
export async function discordRequest(endpoint, options) {
  try {
    const url = `https://discord.com/api/v10/${endpoint}`

    // Log the request being made
    console.log(`Making Discord API request to: ${url}`)
    console.log("Request options:", JSON.stringify(options, null, 2))

    const res = await fetch(url, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      ...options,
    })

    // Log the response status
    console.log(`Response status: ${res.status}`)

    if (!res.ok) {
      const data = await res.json().catch(() => ({ status: res.status }))
      console.error("Discord API error:", data)
      throw new Error(JSON.stringify(data))
    }

    return res
  } catch (error) {
    console.error("Error in discordRequest:", error)
    throw error
  }
}

// Register slash commands with Discord
export async function registerCommands(commands) {
  try {
    const url = `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/commands`

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      method: "PUT",
      body: JSON.stringify(commands),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Error registering commands: ${text}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error in registerCommands:", error)
    throw error
  }
}

// Set the logging channel for a guild
export async function setLoggingChannel(guildId, channelId) {
  try {
    await prisma.loggingChannel.upsert({
      where: { guildId },
      update: { channelId },
      create: { guildId, channelId },
    })
    return true
  } catch (error) {
    console.error("Error setting logging channel:", error)
    return false
  }
}

// Disable logging for a guild
export async function disableLogging(guildId) {
  try {
    const result = await prisma.loggingChannel
      .delete({
        where: { guildId },
      })
      .catch(() => null)

    return !!result
  } catch (error) {
    console.error("Error disabling logging:", error)
    return false
  }
}

// Get the logging channel for a guild
export async function getLoggingChannel(guildId) {
  try {
    const logging = await prisma.loggingChannel.findUnique({
      where: { guildId },
    })
    return logging?.channelId
  } catch (error) {
    console.error("Error getting logging channel:", error)
    return null
  }
}

// Send a log message to the logging channel
export async function sendLogMessage(guildId, embed) {
  try {
    const loggingChannelId = await getLoggingChannel(guildId)

    if (!loggingChannelId) {
      return false // Logging not enabled for this guild
    }

    await discordRequest(`channels/${loggingChannelId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        embeds: [embed],
      }),
    })
    return true
  } catch (error) {
    console.error("Error sending log message:", error)
    return false
  }
}

// Create a log embed for moderation actions
export function createLogEmbed(action, moderator, user, reason, details = {}) {
  // Set color based on action type
  let color
  switch (action.toLowerCase()) {
    case "ban":
      color = 0xed4245 // Red
      break
    case "kick":
      color = 0xfee75c // Yellow
      break
    case "warn":
      color = 0xf8a532 // Orange
      break
    case "purge":
      color = 0x5865f2 // Blurple
      break
    case "role add":
      color = 0x57f287 // Green
      break
    case "role remove":
      color = 0xeb459e // Pink
      break
    default:
      color = 0x95a5a6 // Grey
  }

  // Create the embed
  const embed = {
    title: `${action.toUpperCase()} | Moderation Action`,
    color: color,
    timestamp: new Date().toISOString(),
    footer: {
      text: `ID: ${user?.id || "N/A"}`,
    },
    fields: [],
  }

  // Add fields based on available information
  if (moderator) {
    embed.fields.push({
      name: "Moderator",
      value: `<@${moderator.id}> (${moderator.username})`,
      inline: true,
    })
  }

  if (user) {
    embed.fields.push({
      name: "User",
      value: `<@${user.id}> (${user.username})`,
      inline: true,
    })
  }

  if (reason) {
    embed.fields.push({
      name: "Reason",
      value: reason,
      inline: false,
    })
  }

  // Add any additional details
  for (const [key, value] of Object.entries(details)) {
    if (value) {
      embed.fields.push({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: String(value),
        inline: true,
      })
    }
  }

  return embed
}

// GitHub Webhook Functions

// Set up a GitHub webhook for a repository
export async function setGithubWebhook(guildId, repository, channelId, events = "all") {
  try {
    await prisma.githubWebhook.upsert({
      where: {
        guildId_repository: {
          guildId,
          repository,
        },
      },
      update: { channelId, events },
      create: { guildId, repository, channelId, events },
    })
    return true
  } catch (error) {
    console.error("Error setting GitHub webhook:", error)
    return false
  }
}

// Remove a GitHub webhook for a repository
export async function removeGithubWebhook(guildId, repository) {
  try {
    const result = await prisma.githubWebhook
      .delete({
        where: {
          guildId_repository: {
            guildId,
            repository,
          },
        },
      })
      .catch(() => null)

    return !!result
  } catch (error) {
    console.error("Error removing GitHub webhook:", error)
    return false
  }
}

// List all GitHub webhooks for a guild
export async function listGithubWebhooks(guildId) {
  try {
    const webhooks = await prisma.githubWebhook.findMany({
      where: { guildId },
    })

    return webhooks.map((webhook) => ({
      repository: webhook.repository,
      channelId: webhook.channelId,
      events: webhook.events,
    }))
  } catch (error) {
    console.error("Error listing GitHub webhooks:", error)
    return []
  }
}

// Find webhook configuration for a repository
export async function findGithubWebhook(repository) {
  try {
    const webhook = await prisma.githubWebhook.findFirst({
      where: {
        repository: {
          equals: repository,
          mode: "insensitive",
        },
      },
    })

    if (webhook) {
      return {
        guildId: webhook.guildId,
        channelId: webhook.channelId,
        events: webhook.events,
      }
    }
    return null
  } catch (error) {
    console.error("Error finding GitHub webhook:", error)
    return null
  }
}

// Create a GitHub event embed
export function createGithubEventEmbed(event, payload) {
  const embed = {
    title: "",
    description: "",
    url: "",
    color: 0x2b3137, // GitHub dark color
    author: {
      name: "",
      url: "",
      icon_url: "",
    },
    footer: {
      text: "GitHub",
    },
    timestamp: new Date().toISOString(),
    fields: [],
  }

  // Common author setup
  if (payload.sender) {
    embed.author.name = payload.sender.login
    embed.author.url = payload.sender.html_url
    embed.author.icon_url = payload.sender.avatar_url
  }

  // Set up embed based on event type
  switch (event) {
    case "push":
      const branch = payload.ref.replace("refs/heads/", "")
      const commits = payload.commits.slice(0, 5) // Limit to 5 commits

      embed.title = `[${payload.repository.name}] ${commits.length} new commit${commits.length === 1 ? "" : "s"} to ${branch}`
      embed.url = payload.compare
      embed.description = commits
        .map((commit) => {
          const message = commit.message.split("\n")[0].substring(0, 50) + (commit.message.length > 50 ? "..." : "")
          return `[\`${commit.id.substring(0, 7)}\`](${commit.url}) ${message} - ${commit.author.username}`
        })
        .join("\n")

      if (payload.commits.length > 5) {
        embed.description += `\n... and ${payload.commits.length - 5} more commits`
      }

      embed.color = 0x24292e // GitHub dark
      break

    case "pull_request":
      const action = payload.action
      const pr = payload.pull_request

      embed.title = `[${payload.repository.name}] Pull request ${action}: ${pr.title}`
      embed.url = pr.html_url
      embed.description = pr.body ? pr.body.substring(0, 200) + (pr.body.length > 200 ? "..." : "") : ""

      embed.fields.push(
        { name: "Status", value: pr.state, inline: true },
        { name: "Merged", value: pr.merged ? "Yes" : "No", inline: true },
      )

      if (action === "opened" || action === "reopened") {
        embed.color = 0x2cbe4e // Green
      } else if (action === "closed" && pr.merged) {
        embed.color = 0x6f42c1 // Purple for merged
      } else if (action === "closed") {
        embed.color = 0xcb2431 // Red for closed without merge
      }
      break

    case "issues":
      const issue = payload.issue

      embed.title = `[${payload.repository.name}] Issue ${payload.action}: ${issue.title}`
      embed.url = issue.html_url
      embed.description = issue.body ? issue.body.substring(0, 200) + (issue.body.length > 200 ? "..." : "") : ""

      embed.fields.push({ name: "Status", value: issue.state, inline: true })

      if (payload.action === "opened" || payload.action === "reopened") {
        embed.color = 0x2cbe4e // Green
      } else if (payload.action === "closed") {
        embed.color = 0xcb2431 // Red
      }
      break

    case "release":
      const release = payload.release

      embed.title = `[${payload.repository.name}] Release ${payload.action}: ${release.name || release.tag_name}`
      embed.url = release.html_url
      embed.description = release.body ? release.body.substring(0, 200) + (release.body.length > 200 ? "..." : "") : ""

      embed.color = 0xf1e05a // Yellow
      break

    default:
      embed.title = `[${payload.repository.name}] ${event} event received`
      embed.url = payload.repository.html_url
      embed.color = 0x2b3137 // GitHub dark color
  }

  return embed
}

// Add a warning to the database
export async function addWarning(guildId, userId, moderatorId, reason, anonymous = true, dmSent = false) {
  try {
    const warning = await prisma.warning.create({
      data: {
        guildId,
        userId,
        moderatorId,
        reason,
        anonymous,
        dmSent,
      },
    })
    return warning
  } catch (error) {
    console.error("Error adding warning:", error)
    return null
  }
}

// Get warnings for a user in a guild
export async function getWarnings(guildId, userId) {
  try {
    const warnings = await prisma.warning.findMany({
      where: {
        guildId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return warnings
  } catch (error) {
    console.error("Error getting warnings:", error)
    return []
  }
}

// Clear all warnings for a user in a guild
export async function clearWarnings(guildId, userId) {
  try {
    const { count } = await prisma.warning.deleteMany({
      where: {
        guildId,
        userId,
      },
    })
    return count
  } catch (error) {
    console.error("Error clearing warnings:", error)
    return 0
  }
}

// Clear a specific warning by ID
export async function clearWarning(warningId) {
  try {
    const warning = await prisma.warning.delete({
      where: {
        id: warningId,
      },
    })
    return warning
  } catch (error) {
    console.error("Error clearing warning:", error)
    return null
  }
}
