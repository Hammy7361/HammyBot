import { NextResponse } from "next/server"
import { verifyDiscordRequest } from "../../../../lib/discord/verifyRequest"
import { discordRequest } from "../../../../lib/discord/api"
import { sendLogMessage, createLogEmbed } from "../../../../lib/discord/logs"
import { setLoggingChannel, disableLogging, getLoggingChannel } from "../../../../lib/db/loggingChannels"
import { setGithubWebhook, removeGithubWebhook, listGithubWebhooks } from "../../../../lib/github/webhooks"
import { addWarning, getWarnings, clearWarnings, clearWarning } from "../../../../lib/db/warnings"
import { setStarboardConfig, getStarboardConfig, disableStarboard } from "../../../../lib/discord/starboard"
import {
  getUserPoints,
  setUserPoints,
  increaseUserPoints,
  decreaseUserPoints,
  resetUserPoints,
  resetAllPoints,
  getLeaderboard,
  getPointsByRole,
  canManagePoints,
} from "../../../../lib/discord/points"
import { getXpConfig, updateXpConfig, getUserVoiceStats, getUserMediaStats } from "../../../../bot/discord/commands"

// Interaction type constants
const PING = 1
const APPLICATION_COMMAND = 2
const MESSAGE_COMPONENT = 3

// Interaction response type constants
const PONG = 1
const CHANNEL_MESSAGE_WITH_SOURCE = 4
const DEFERRED_UPDATE_MESSAGE = 6
const UPDATE_MESSAGE = 7

// Component types
const BUTTON = 2

// Configure your GitHub repository URL here - you can update this to your actual repository URL
const GITHUB_REPO_URL = "https://github.com/Hammy7361/HammyBot"

// Store verification role IDs (in a real app, use a database)
const verificationRoles = new Map()

export async function POST(req) {
  try {
    console.log("Received Discord interaction")

    // Clone the request for verification
    const reqClone = req.clone()

    // Verify the request is from Discord
    const { isValid, body } = await verifyDiscordRequest(reqClone)

    console.log("Request validation:", isValid ? "valid" : "invalid")

    if (!isValid) {
      console.log("Invalid request signature")
      return NextResponse.json({ error: "Invalid request" }, { status: 401 })
    }

    console.log("Request body type:", body.type)

    // Handle Discord's ping
    if (body.type === PING) {
      console.log("Handling Discord ping")
      return NextResponse.json({ type: PONG })
    }

    // Handle button interactions
    if (body.type === MESSAGE_COMPONENT) {
      console.log("Handling component interaction:", body.data?.custom_id)

      const { custom_id } = body.data
      const guildId = body.guild_id
      const userId = body.member.user.id

      // Handle verification button click
      if (custom_id.startsWith("verify_")) {
        const roleId = custom_id.replace("verify_", "")

        try {
          // Add the role to the user
          await discordRequest(`guilds/${guildId}/members/${userId}/roles/${roleId}`, {
            method: "PUT",
          })

          // Get user information for logging
          const userResponse = await discordRequest(`users/${userId}`, {
            method: "GET",
          })
          const user = await userResponse.json()

          // Get role information for logging
          const roleResponse = await discordRequest(`guilds/${guildId}/roles`, {
            method: "GET",
          })
          const roles = await roleResponse.json()
          const role = roles.find((r) => r.id === roleId)

          // Get information about the user who executed the command
          const moderator = {
            id: "BOT",
            username: "Verification System",
          }

          // Send log if logging is enabled
          const logEmbed = createLogEmbed("role add", moderator, user, "User verified themselves", {
            Role: role ? `${role.name} (${role.id})` : roleId,
          })

          sendLogMessage(guildId, logEmbed)

          // Respond with an ephemeral message only the user can see
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `✅ You have been verified and given the ${role ? role.name : "verification"} role!`,
              flags: 64, // Ephemeral flag - only visible to the user who clicked
            },
          })
        } catch (error) {
          console.error("Error verifying user:", error)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "❌ There was an error verifying you. Please contact a server administrator.",
              flags: 64, // Ephemeral flag
            },
          })
        }
      }

      // Default response for unhandled component interactions
      return NextResponse.json({
        type: CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "This interaction is not supported.",
          flags: 64, // Ephemeral flag
        },
      })
    }

    // Handle slash commands
    if (body.type === APPLICATION_COMMAND) {
      console.log("Handling slash command:", body.data?.name)

      const { name, options } = body.data || {}
      const guildId = body.guild_id
      const channelId = body.channel_id

      // Get information about the user who executed the command
      const moderator = {
        id: body.member.user.id,
        username: body.member.user.username,
      }

      // Handle verify command
      if (name === "verify") {
        const roleOption = options.find((opt) => opt.name === "role")
        const titleOption = options.find((opt) => opt.name === "title")
        const descriptionOption = options.find((opt) => opt.name === "description")
        const buttonTextOption = options.find((opt) => opt.name === "button_text")
        const colorOption = options.find((opt) => opt.name === "color")

        if (!roleOption) {
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Please specify a role to give when users verify." },
          })
        }

        const roleId = roleOption.value
        const title = titleOption?.value || "Server Verification"
        const description =
          descriptionOption?.value || "Click the button below to verify yourself and gain access to the server."
        const buttonText = buttonTextOption?.value || "Verify Me"

        // Parse color or use default blue
        let color = 0x5865f2 // Discord blurple
        if (colorOption?.value) {
          try {
            // Remove # if present and convert to decimal
            const colorHex = colorOption.value.replace(/^#/, "")
            color = Number.parseInt(colorHex, 16)
          } catch (e) {
            console.error("Invalid color format:", e)
          }
        }

        // Store the role ID for verification
        verificationRoles.set(guildId, roleId)

        // Create the verification embed
        return NextResponse.json({
          type: CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                title: title,
                description: description,
                color: color,
                footer: {
                  text: "Click the button below to verify",
                },
                timestamp: new Date().toISOString(),
              },
            ],
            components: [
              {
                type: 1, // ACTION_ROW
                components: [
                  {
                    type: BUTTON,
                    style: 1, // PRIMARY
                    label: buttonText,
                    custom_id: `verify_${roleId}`,
                  },
                ],
              },
            ],
          },
        })
      }

      // Handle GitHub command
      if (name === "github") {
        return NextResponse.json({
          type: CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `📚 **GitHub Repository**
Check out my source code and contribute to my development: ${GITHUB_REPO_URL}
Created by <@371771143993950211>`,
            components: [
              {
                type: 1, // ACTION_ROW
                components: [
                  {
                    type: 2, // BUTTON
                    style: 5, // LINK
                    label: "View on GitHub",
                    url: GITHUB_REPO_URL,
                  },
                ],
              },
            ],
          },
        })
      }

      // Handle Listening command
      if (name === "listening") {
        const userId = options.find((opt) => opt.name === "user")?.value

        if (!userId) {
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Please specify a user to check what they're listening to." },
          })
        }

        try {
          // First, get the user's basic info
          const userResponse = await discordRequest(`users/${userId}`, {
            method: "GET",
          })

          if (!userResponse.ok) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "Failed to fetch user information." },
            })
          }

          const user = await userResponse.json()

          // Get the guild member with presence intent
          // Note: This requires the bot to have the PRESENCE intent enabled in the Discord Developer Portal
          const memberResponse = await discordRequest(`guilds/${guildId}/members/${userId}`, {
            method: "GET",
          })

          if (!memberResponse.ok) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "Failed to fetch member information." },
            })
          }

          const member = await memberResponse.json()

          // Add this after getting the member data
          console.log("Full member data:", JSON.stringify(member, null, 2))
          console.log(
            "Member presence:",
            member.presence ? JSON.stringify(member.presence, null, 2) : "No presence data",
          )

          // Add this after getting the member data
          console.log(
            "Member presence data:",
            member.presence ? JSON.stringify(member.presence, null, 2) : "No presence data",
          )

          // We need to get the presence separately since it might not be included in the member response
          const presenceResponse = await discordRequest(`guilds/${guildId}/presences/${userId}`, {
            method: "GET",
          }).catch((err) => {
            console.error("Error fetching presence:", err)
            return { ok: false }
          })

          let activities = []

          // Try to get activities from the presence response
          if (presenceResponse && presenceResponse.ok) {
            const presence = await presenceResponse.json()
            activities = presence.activities || []
          }
          // Fallback to member.presence if available
          else if (member.presence && member.presence.activities) {
            activities = member.presence.activities
          }

          // If we still don't have activities, try getting them from the guild's presences
          if (!activities || activities.length === 0) {
            try {
              console.log("Attempting to fetch guild presences...")
              const guildResponse = await discordRequest(`guilds/${guildId}?with_presences=true`, {
                method: "GET",
              })

              if (guildResponse.ok) {
                const guild = await guildResponse.json()
                console.log("Guild presences:", JSON.stringify(guild.presences, null, 2))

                const userPresence = guild.presences?.find((p) => p.user.id === userId)
                if (userPresence?.activities) {
                  activities = userPresence.activities
                  console.log("Found activities from guild presences:", JSON.stringify(activities, null, 2))
                }
              }
            } catch (error) {
              console.error("Error fetching guild presences:", error)
            }
          }

          console.log("Raw activities array:", JSON.stringify(activities, null, 2))

          // Find a music activity - check for multiple types of music activities
          const musicActivity = activities.find((activity) => {
            console.log("Checking activity:", JSON.stringify(activity, null, 2))

            // Check if user has the "listening" status
            if (activity.type === 2 || activity.type === "LISTENING") return true

            // Check for YouTube Music
            if (activity.name === "YouTube Music" || activity.application_id === "880218394199220334") return true

            // Check for Spotify
            if (activity.name === "Spotify") return true

            // Check for custom activities (type 0) with music service names
            if (
              (activity.type === 0 || activity.type === "CUSTOM") &&
              (activity.name?.toLowerCase().includes("spotify") ||
                activity.name?.toLowerCase().includes("youtube") ||
                activity.name?.toLowerCase().includes("apple music") ||
                activity.name?.toLowerCase().includes("soundcloud") ||
                activity.name?.toLowerCase().includes("tidal") ||
                activity.name?.toLowerCase().includes("deezer") ||
                activity.name?.toLowerCase().includes("pandora") ||
                activity.name?.toLowerCase().includes("music"))
            )
              return true

            // Check activity state and details for music-related terms
            const musicTerms = ["listening to", "playing", "track", "song", "music"]
            const activityText = `${activity.state || ""} ${activity.details || ""}`.toLowerCase()
            if (musicTerms.some((term) => activityText.includes(term))) return true

            return false
          })

          console.log("Found music activity:", musicActivity ? JSON.stringify(musicActivity, null, 2) : "None")

          if (!musicActivity) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `<@${userId}> is online but not currently listening to music.`,
                allowed_mentions: { parse: [] }, // Prevent user ping
              },
            })
          }

          // Extract music information - different services structure this differently
          let songName = "Unknown Song"
          let artist = "Unknown Artist"
          let album = "Unknown Album"
          const serviceName = musicActivity.name || "Music Service"

          // YouTube Music specific handling
          if (musicActivity.application_id === "880218394199220334" || musicActivity.name === "YouTube Music") {
            songName = musicActivity.details || songName
            artist = musicActivity.state || artist
          }
          // Standard music activity handling
          else if (musicActivity.details) {
            songName = musicActivity.details
            if (musicActivity.state) {
              // Some services put "Artist - Album" in state
              if (musicActivity.state.includes(" - ")) {
                const [artistPart, albumPart] = musicActivity.state.split(" - ")
                artist = artistPart
                album = albumPart
              } else {
                artist = musicActivity.state
              }
            }
          }

          console.log("Extracted music info:", { songName, artist, album, serviceName })

          // Try to create a link based on the service
          let songLink = ""
          let color = 0x1db954 // Spotify green default
          let musicServiceName = musicActivity.name || "Music Service"

          if (musicActivity.name && musicActivity.name.toLowerCase().includes("spotify")) {
            // For Spotify, we can create a search link
            const encodedSong = encodeURIComponent(`${songName} ${artist}`)
            songLink = `https://open.spotify.com/search/${encodedSong}`

            // If we have Spotify metadata with a track ID, use that instead
            if (musicActivity.sync_id) {
              songLink = `https://open.spotify.com/track/${musicActivity.sync_id}`
            }

            musicServiceName = "Spotify"
          } else if (musicActivity.name && musicActivity.name.toLowerCase().includes("youtube")) {
            // For YouTube Music
            const encodedSong = encodeURIComponent(`${songName} ${artist}`)
            songLink = `https://music.youtube.com/search?q=${encodedSong}`
            color = 0xff0000 // YouTube red
            musicServiceName = "YouTube Music"
          } else if (musicActivity.name && musicActivity.name.toLowerCase().includes("apple")) {
            // For Apple Music
            const encodedSong = encodeURIComponent(`${songName} ${artist}`)
            songLink = `https://music.apple.com/search?term=${encodedSong}`
            color = 0xfa243c // Apple Music red
            musicServiceName = "Apple Music"
          } else {
            // Generic search fallback
            const encodedSong = encodeURIComponent(`${songName} ${artist}`)
            songLink = `https://www.google.com/search?q=${encodedSong}`
          }

          // Create a timestamp for how long they've been listening
          let listeningDuration = ""
          if (musicActivity.timestamps && musicActivity.timestamps.start) {
            const startTime = new Date(musicActivity.timestamps.start).getTime()
            const currentTime = Date.now()
            const durationMs = currentTime - startTime

            // Format duration as mm:ss
            const minutes = Math.floor(durationMs / 60000)
            const seconds = Math.floor((durationMs % 60000) / 1000)
            listeningDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`
          }

          // Create an embed with the song information
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              embeds: [
                {
                  title: songName,
                  description: `by ${artist}`,
                  color: color,
                  fields: [
                    {
                      name: "Album",
                      value: album,
                      inline: true,
                    },
                    {
                      name: "Service",
                      value: musicServiceName,
                      inline: true,
                    },
                    {
                      name: "Listening for",
                      value: listeningDuration || "Unknown",
                      inline: true,
                    },
                  ],
                  author: {
                    name: `${user.username} is listening to`,
                    icon_url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
                  },
                  footer: {
                    text: "Powered by Hammy Bot",
                  },
                  timestamp: new Date().toISOString(),
                },
              ],
              components: [
                {
                  type: 1, // ACTION_ROW
                  components: [
                    {
                      type: 2, // BUTTON
                      style: 5, // LINK
                      label: "Listen on " + musicServiceName,
                      url: songLink,
                    },
                  ],
                },
              ],
            },
          })
        } catch (error) {
          console.error("Error fetching listening activity:", error)
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content:
                "Failed to fetch listening activity. This might be due to Discord API limitations or missing permissions.",
              flags: 64, // Ephemeral flag - only visible to the command user
            },
          })
        }
      }

      // Handle logging command
      else if (name === "logging") {
        const subCommand = options[0].name

        if (subCommand === "set") {
          const channelOption = options[0].options.find((opt) => opt.name === "channel")
          const loggingChannelId = channelOption.value

          // Check if the channel is a text channel
          try {
            const channelResponse = await discordRequest(`channels/${loggingChannelId}`, {
              method: "GET",
            })

            const channel = await channelResponse.json()

            if (channel.type !== 0) {
              // 0 is text channel
              return NextResponse.json({
                type: CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: "The logging channel must be a text channel." },
              })
            }

            // Set the logging channel
            const success = await setLoggingChannel(guildId, loggingChannelId)

            if (!success) {
              return NextResponse.json({
                type: CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: "Failed to set logging channel. Please try again later.",
                  flags: 64,
                },
              })
            }

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Logging has been enabled in <#${loggingChannelId}>!`,
                flags: 64, // Ephemeral flag - only visible to the command user
              },
            })
          } catch (error) {
            console.error("Error setting logging channel:", error)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to set logging channel. Please check bot permissions.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "disable") {
          // Disable logging
          const wasEnabled = await disableLogging(guildId)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: wasEnabled ? "Logging has been disabled." : "Logging was not enabled for this server.",
              flags: 64,
            },
          })
        } else if (subCommand === "status") {
          // Check logging status
          const loggingChannelId = await getLoggingChannel(guildId)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: loggingChannelId
                ? `Logging is currently enabled in <#${loggingChannelId}>.`
                : "Logging is currently disabled for this server.",
              flags: 64,
            },
          })
        }
      }

      // Handle role command
      else if (name === "role" && options && options.length > 0) {
        const subCommand = options[0].name
        const subCommandOptions = options[0].options || []

        const userOption = subCommandOptions.find((opt) => opt.name === "user")
        const roleOption = subCommandOptions.find((opt) => opt.name === "role")

        if (!userOption || !roleOption) {
          console.error("Missing required options")
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Missing required user or role option." },
          })
        }

        const userId = userOption.value
        const roleId = roleOption.value

        console.log(`Processing role ${subCommand} command`)
        console.log(`Guild ID: ${guildId}, User ID: ${userId}, Role ID: ${roleId}`)

        try {
          // Get user information for logging
          const userResponse = await discordRequest(`users/${userId}`, {
            method: "GET",
          })

          const user = await userResponse.json()

          // Get role information for logging
          const roleResponse = await discordRequest(`guilds/${guildId}/roles`, {
            method: "GET",
          })

          const roles = await roleResponse.json()
          const role = roles.find((r) => r.id === roleId)

          if (subCommand === "add") {
            // Add role to user
            console.log(`Adding role ${roleId} to user ${userId}`)
            await discordRequest(`guilds/${guildId}/members/${userId}/roles/${roleId}`, {
              method: "PUT",
            })

            // Send log if logging is enabled
            const logEmbed = createLogEmbed("role add", moderator, user, null, {
              Role: role ? `${role.name} (${role.id})` : roleId,
            })

            sendLogMessage(guildId, logEmbed)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Successfully added <@&${roleId}> to <@${userId}>!`,
                allowed_mentions: { parse: [] }, // Prevent role and user pings
              },
            })
          } else if (subCommand === "remove") {
            // Remove role from user
            console.log(`Removing role ${roleId} from user ${userId}`)
            await discordRequest(`guilds/${guildId}/members/${userId}/roles/${roleId}`, {
              method: "DELETE",
            })

            // Send log if logging is enabled
            const logEmbed = createLogEmbed("role remove", moderator, user, null, {
              Role: role ? `${role.name} (${role.id})` : roleId,
            })

            sendLogMessage(guildId, logEmbed)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Successfully removed <@&${roleId}> from <@${userId}>!`,
                allowed_mentions: { parse: [] }, // Prevent role and user pings
              },
            })
          }
        } catch (error) {
          console.error("Error managing roles:", error)

          // Check if it's a permission error
          let errorMessage = "Failed to manage roles. Please check bot permissions."

          if (error.message && error.message.includes("Missing Permissions")) {
            errorMessage =
              "I don't have permission to manage this role. Make sure my role is higher than the role you're trying to manage."
          }

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: errorMessage },
          })
        }
      }

      // Handle purge command
      else if (name === "purge") {
        const amount = options.find((opt) => opt.name === "amount")?.value

        if (!amount) {
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Please specify the number of messages to delete." },
          })
        }

        try {
          // First, get messages from the channel
          const messagesResponse = await discordRequest(`channels/${channelId}/messages?limit=${amount}`, {
            method: "GET",
          })

          const messages = await messagesResponse.json()

          if (messages.length === 0) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "No messages found to delete." },
            })
          }

          // Get message IDs
          const messageIds = messages.map((msg) => msg.id)

          // Bulk delete messages (for messages less than 14 days old)
          await discordRequest(`channels/${channelId}/messages/bulk-delete`, {
            method: "POST",
            body: JSON.stringify({ messages: messageIds }),
          })

          // Send log if logging is enabled
          const logEmbed = createLogEmbed("purge", moderator, null, null, {
            Channel: `<#${channelId}>`,
            "Messages Deleted": messageIds.length,
            "Oldest Message ID": messageIds[messageIds.length - 1],
            "Newest Message ID": messageIds[0],
          })

          sendLogMessage(guildId, logEmbed)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Successfully deleted ${messageIds.length} messages.`,
              flags: 64, // Ephemeral flag - only visible to the command user
            },
          })
        } catch (error) {
          console.error("Error purging messages:", error)

          let errorMessage = "Failed to delete messages. Please check bot permissions."

          // Check for common errors
          if (error.message && error.message.includes("Missing Permissions")) {
            errorMessage = "I don't have permission to delete messages in this channel."
          } else if (error.message && error.message.includes("message_too_old")) {
            errorMessage = "Some messages are older than 14 days and cannot be bulk deleted."
          }

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: errorMessage },
          })
        }
      }

      // Handle warn command
      else if (name === "warn") {
        const userId = options.find((opt) => opt.name === "user")?.value
        const reason = options.find((opt) => opt.name === "reason")?.value
        const anonymous = options.find((opt) => opt.name === "anonymous")?.value ?? true // Default to true if not specified

        if (!userId || !reason) {
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Please specify both a user and a reason for the warning." },
          })
        }

        try {
          // Get user information for logging
          const userResponse = await discordRequest(`users/${userId}`, {
            method: "GET",
          })

          const user = await userResponse.json()

          // Directly fetch the guild information to get the server name
          let guildName = "Discord Server" // Default fallback

          try {
            if (guildId) {
              const guildResponse = await discordRequest(`guilds/${guildId}`, {
                method: "GET",
              })

              const guild = await guildResponse.json()
              if (guild && guild.name) {
                guildName = guild.name
                console.log(`Successfully fetched guild name: ${guildName}`)
              }
            }
          } catch (guildError) {
            console.error("Error fetching guild information:", guildError)
            // Continue with the default name if there's an error
          }

          // Create the warning message
          let warningMessage = `**Warning from ${guildName}**\n\n`

          // Add moderator info if not anonymous
          if (!anonymous) {
            warningMessage += `**Moderator:** ${body.member.user.username}\n\n`
          }

          warningMessage += `**Reason:** ${reason}`

          // Send a DM to the user with the warning
          let dmSent = false
          try {
            // First, create a DM channel
            const dmChannelResponse = await discordRequest(`users/@me/channels`, {
              method: "POST",
              body: JSON.stringify({ recipient_id: userId }),
            })

            const dmChannel = await dmChannelResponse.json()

            // Send the warning message
            await discordRequest(`channels/${dmChannel.id}/messages`, {
              method: "POST",
              body: JSON.stringify({
                content: warningMessage,
              }),
            })

            dmSent = true
          } catch (dmError) {
            console.error("Error sending DM:", dmError)
            // Continue even if DM fails
          }

          // Store the warning in the database
          await addWarning(guildId, userId, moderator.id, reason, anonymous, dmSent)

          // Send log if logging is enabled
          const logEmbed = createLogEmbed("warn", moderator, user, reason, {
            "DM Sent": dmSent ? "Yes" : "No (User may have DMs disabled)",
            Anonymous: anonymous ? "Yes" : "No",
          })

          await sendLogMessage(guildId, logEmbed)

          // Send confirmation in the channel
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Warning sent to <@${userId}> for: ${reason}${!dmSent ? " (Note: Could not send DM to user)" : ""}`,
              allowed_mentions: { parse: [] }, // Prevent user ping
            },
          })
        } catch (error) {
          console.error("Error warning user:", error)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Warning logged for <@${userId}>, but I couldn't DM them. They may have DMs disabled.`,
              allowed_mentions: { parse: [] }, // Prevent user ping
            },
          })
        }
      }

      // Handle kick command
      else if (name === "kick") {
        const userId = options.find((opt) => opt.name === "user")?.value
        const reason = options.find((opt) => opt.name === "reason")?.value || "No reason provided"

        if (!userId) {
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Please specify a user to kick." },
          })
        }

        try {
          // Get user information for logging
          const userResponse = await discordRequest(`users/${userId}`, {
            method: "GET",
          })

          const user = await userResponse.json()

          // Kick the user
          await discordRequest(`guilds/${guildId}/members/${userId}`, {
            method: "DELETE",
            body: JSON.stringify({ reason }),
          })

          // Send log if logging is enabled
          const logEmbed = createLogEmbed("kick", moderator, user, reason)

          sendLogMessage(guildId, logEmbed)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Successfully kicked <@${userId}> for: ${reason}`,
              allowed_mentions: { parse: [] }, // Prevent user ping
            },
          })
        } catch (error) {
          console.error("Error kicking user:", error)

          let errorMessage = "Failed to kick user. Please check bot permissions."

          if (error.message && error.message.includes("Missing Permissions")) {
            errorMessage =
              "I don't have permission to kick this user. Make sure my role is higher than their highest role."
          }

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: errorMessage },
          })
        }
      }

      // Handle ban command
      else if (name === "ban") {
        const userId = options.find((opt) => opt.name === "user")?.value
        const reason = options.find((opt) => opt.name === "reason")?.value || "No reason provided"
        const days = options.find((opt) => opt.name === "days")?.value || 0

        if (!userId) {
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Please specify a user to ban." },
          })
        }

        try {
          // Get user information for logging
          const userResponse = await discordRequest(`users/${userId}`, {
            method: "GET",
          })

          const user = await userResponse.json()

          // Ban the user
          await discordRequest(`guilds/${guildId}/bans/${userId}`, {
            method: "PUT",
            body: JSON.stringify({
              delete_message_days: days,
              reason,
            }),
          })

          // Send log if logging is enabled
          const logEmbed = createLogEmbed("ban", moderator, user, reason, {
            "Messages Deleted": days > 0 ? `${days} days` : "None",
          })

          sendLogMessage(guildId, logEmbed)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Successfully banned <@${userId}> for: ${reason}`,
              allowed_mentions: { parse: [] }, // Prevent user ping
            },
          })
        } catch (error) {
          console.error("Error banning user:", error)

          let errorMessage = "Failed to ban user. Please check bot permissions."

          if (error.message && error.message.includes("Missing Permissions")) {
            errorMessage =
              "I don't have permission to ban this user. Make sure my role is higher than their highest role."
          }

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: errorMessage },
          })
        }
      }

      // Handle GitHub webhook command
      else if (name === "github-webhook") {
        const subCommand = options[0].name

        if (subCommand === "setup") {
          const repositoryOption = options[0].options.find((opt) => opt.name === "repository")
          const channelOption = options[0].options.find((opt) => opt.name === "channel")
          const eventsOption = options[0].options.find((opt) => opt.name === "events")

          if (!repositoryOption || !channelOption) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "Please specify both a repository and a channel." },
            })
          }

          const repository = repositoryOption.value
          const channelId = channelOption.value
          const events = eventsOption?.value || "all"

          // Validate repository format (owner/repo)
          if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repository)) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "Invalid repository format. Please use the format: owner/repo" },
            })
          }

          // Validate events format
          const validEvents = ["push", "pr", "issue", "release", "all"]
          const eventList = events.split(",")
          for (const event of eventList) {
            if (!validEvents.includes(event.trim())) {
              return NextResponse.json({
                type: CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: `Invalid event: ${event}. Valid events are: ${validEvents.join(", ")}`,
                },
              })
            }
          }

          // Set up the webhook
          const success = await setGithubWebhook(guildId, repository, channelId, events)

          if (!success) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to set up GitHub webhook. Please try again later.",
                flags: 64,
              },
            })
          }

          // Generate the webhook URL
          const webhookUrl = `${req.headers.get("origin") || "https://your-bot-url.vercel.app"}/api/github/webhook`

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `GitHub webhook set up for \`${repository}\`!

To complete setup, add this webhook URL to your GitHub repository:
\`\`\`
${webhookUrl}
\`\`\`

1. Go to your repository on GitHub
2. Click on "Settings" > "Webhooks" > "Add webhook"
3. Set the Payload URL to the URL above
4. Set Content type to "application/json"
5. Set Secret to your GITHUB_WEBHOOK_SECRET environment variable
6. Select events based on your configuration: ${events}
7. Click "Add webhook"`,
              flags: 64, // Ephemeral flag - only visible to the command user
            },
          })
        } else if (subCommand === "list") {
          // List all webhooks
          const webhooks = await listGithubWebhooks(guildId)

          if (webhooks.length === 0) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "No GitHub webhooks are configured for this server.",
                flags: 64,
              },
            })
          }

          const webhookList = webhooks
            .map((webhook) => `- \`${webhook.repository}\` → <#${webhook.channelId}> (Events: ${webhook.events})`)
            .join("\n")

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `**GitHub Webhooks for this server:**
${webhookList}`,
              flags: 64,
            },
          })
        } else if (subCommand === "remove") {
          const repositoryOption = options[0].options.find((opt) => opt.name === "repository")

          if (!repositoryOption) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "Please specify a repository." },
            })
          }

          const repository = repositoryOption.value
          const removed = await removeGithubWebhook(guildId, repository)

          if (!removed) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `No webhook found for repository \`${repository}\`.`,
                flags: 64,
              },
            })
          }

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Webhook for \`${repository}\` has been removed.`,
              flags: 64,
            },
          })
        }
      }

      // Handle warnings command
      else if (name === "warnings") {
        const userId = options.find((opt) => opt.name === "user")?.value

        if (!userId) {
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Please specify a user to view warnings for." },
          })
        }

        try {
          // Get user information
          const userResponse = await discordRequest(`users/${userId}`, {
            method: "GET",
          })
          const user = await userResponse.json()

          // Get warnings for the user
          const warnings = await getWarnings(guildId, userId)

          if (warnings.length === 0) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `<@${userId}> has no warnings.`,
                allowed_mentions: { parse: [] }, // Prevent user ping
              },
            })
          }

          // Format warnings
          const warningsList = warnings
            .map((warning, index) => {
              const date = new Date(warning.createdAt).toLocaleString()
              return `**${index + 1}.** ID: \`${warning.id}\`\n**Reason:** ${warning.reason}\n**Date:** ${date}\n**Moderator:** ${warning.anonymous ? "Anonymous" : `<@${warning.moderatorId}>`}\n`
            })
            .join("\n")

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              embeds: [
                {
                  title: `Warnings for ${user.username}`,
                  description: `<@${userId}> has ${warnings.length} warning(s):\n\n${warningsList}`,
                  color: 0xf8a532, // Orange
                  footer: {
                    text: `User ID: ${userId}`,
                  },
                  timestamp: new Date().toISOString(),
                },
              ],
              allowed_mentions: { parse: [] }, // Prevent user ping
            },
          })
        } catch (error) {
          console.error("Error getting warnings:", error)
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Failed to get warnings. Please try again later." },
          })
        }
      }

      // Handle clearwarnings command
      else if (name === "clearwarnings") {
        const userId = options.find((opt) => opt.name === "user")?.value
        const warningId = options.find((opt) => opt.name === "warning_id")?.value

        if (!userId) {
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Please specify a user to clear warnings for." },
          })
        }

        try {
          // Get user information
          const userResponse = await discordRequest(`users/${userId}`, {
            method: "GET",
          })
          const user = await userResponse.json()

          let count = 0
          let message = ""

          if (warningId) {
            // Clear a specific warning
            const warning = await clearWarning(warningId)

            if (warning) {
              count = 1
              message = `Cleared warning with ID \`${warningId}\` for <@${userId}>.`
            } else {
              message = `No warning found with ID \`${warningId}\` for <@${userId}>.`
            }
          } else {
            // Clear all warnings
            count = await clearWarnings(guildId, userId)
            message = `Cleared ${count} warning(s) for <@${userId}>.`
          }

          // Send log if logging is enabled
          const logEmbed = createLogEmbed("warn clear", moderator, user, null, {
            "Warnings Cleared": count,
            "Specific Warning": warningId || "All",
          })

          await sendLogMessage(guildId, logEmbed)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: message,
              allowed_mentions: { parse: [] }, // Prevent user ping
            },
          })
        } catch (error) {
          console.error("Error clearing warnings:", error)
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Failed to clear warnings. Please try again later." },
          })
        }
      }

      // Handle starboard command
      else if (name === "starboard") {
        const subCommand = options[0].name

        if (subCommand === "setup") {
          const channelOption = options[0].options.find((opt) => opt.name === "channel")
          const thresholdOption = options[0].options.find((opt) => opt.name === "threshold")
          const emojiOption = options[0].options.find((opt) => opt.name === "emoji")

          if (!channelOption) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "Please specify a channel for the starboard." },
            })
          }

          const starboardChannelId = channelOption.value
          const threshold = thresholdOption?.value || 3
          const emoji = emojiOption?.value || "⭐"

          // Check if the channel is a text channel
          try {
            const channelResponse = await discordRequest(`channels/${starboardChannelId}`, {
              method: "GET",
            })

            const channel = await channelResponse.json()

            if (channel.type !== 0) {
              // 0 is text channel
              return NextResponse.json({
                type: CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: "The starboard channel must be a text channel." },
              })
            }

            // Set up the starboard
            const success = await setStarboardConfig(guildId, starboardChannelId, threshold, emoji)

            if (!success) {
              return NextResponse.json({
                type: CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: "Failed to set up starboard. Please try again later.",
                  flags: 64,
                },
              })
            }

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Starboard has been set up in <#${starboardChannelId}>!\n\nMessages with ${threshold} or more ${emoji} reactions will be posted there.`,
                flags: 64, // Ephemeral flag - only visible to the command user
              },
            })
          } catch (error) {
            console.error("Error setting up starboard:", error)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to set up starboard. Please check bot permissions.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "disable") {
          // Disable starboard
          const wasEnabled = await disableStarboard(guildId)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: wasEnabled ? "Starboard has been disabled." : "Starboard was not enabled for this server.",
              flags: 64,
            },
          })
        } else if (subCommand === "status") {
          // Check starboard status
          const config = await getStarboardConfig(guildId)

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: config
                ? `Starboard is currently enabled in <#${config.channelId}>.\nThreshold: ${config.threshold} ${config.emoji} reactions`
                : "Starboard is currently disabled for this server.",
              flags: 64,
            },
          })
        }
      }

      // Handle points command
      else if (name === "points") {
        const subCommand = options[0].name
        const subCommandOptions = options[0].options || []

        // Check if user has permission to manage points (except for view)
        if (subCommand !== "view") {
          const hasPermission = await canManagePoints(guildId, moderator.id)
          if (!hasPermission) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "You don't have permission to manage points.",
                flags: 64, // Ephemeral flag
              },
            })
          }
        }

        if (subCommand === "view") {
          const userOption = subCommandOptions.find((opt) => opt.name === "user")
          const targetUserId = userOption?.value || moderator.id // If no user specified, show the command user's points

          try {
            // Get user information
            const userResponse = await discordRequest(`users/${targetUserId}`, {
              method: "GET",
            })
            const user = await userResponse.json()

            // Get points for the user
            const points = await getUserPoints(guildId, targetUserId)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `<@${targetUserId}> has **${points}** points.`,
                allowed_mentions: { parse: [] }, // Prevent user ping
                flags: 64, // Ephemeral flag
              },
            })
          } catch (error) {
            console.error("Error viewing points:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to view points. Please try again later.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "set") {
          const userOption = subCommandOptions.find((opt) => opt.name === "user")
          const pointsOption = subCommandOptions.find((opt) => opt.name === "points")

          if (!userOption || !pointsOption) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Please specify both a user and points value.",
                flags: 64,
              },
            })
          }

          const targetUserId = userOption.value
          const pointsValue = pointsOption.value

          try {
            // Get user information
            const userResponse = await discordRequest(`users/${targetUserId}`, {
              method: "GET",
            })
            const user = await userResponse.json()

            // Set points for the user
            await setUserPoints(guildId, targetUserId, pointsValue)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Set <@${targetUserId}>'s points to **${pointsValue}**.`,
                allowed_mentions: { parse: [] }, // Prevent user ping
              },
            })
          } catch (error) {
            console.error("Error setting points:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to set points. Please try again later.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "add") {
          const userOption = subCommandOptions.find((opt) => opt.name === "user")
          const pointsOption = subCommandOptions.find((opt) => opt.name === "points")

          if (!userOption || !pointsOption) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Please specify both a user and points value.",
                flags: 64,
              },
            })
          }

          const targetUserId = userOption.value
          const pointsValue = pointsOption.value

          try {
            // Get user information
            const userResponse = await discordRequest(`users/${targetUserId}`, {
              method: "GET",
            })
            const user = await userResponse.json()

            // Add points for the user
            const updatedPoints = await increaseUserPoints(guildId, targetUserId, pointsValue)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Added **${pointsValue}** points to <@${targetUserId}>. They now have **${updatedPoints.points}** points.`,
                allowed_mentions: { parse: [] }, // Prevent user ping
              },
            })
          } catch (error) {
            console.error("Error adding points:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to add points. Please try again later.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "remove") {
          const userOption = subCommandOptions.find((opt) => opt.name === "user")
          const pointsOption = subCommandOptions.find((opt) => opt.name === "points")

          if (!userOption || !pointsOption) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Please specify both a user and points value.",
                flags: 64,
              },
            })
          }

          const targetUserId = userOption.value
          const pointsValue = pointsOption.value

          try {
            // Get user information
            const userResponse = await discordRequest(`users/${targetUserId}`, {
              method: "GET",
            })
            const user = await userResponse.json()

            // Remove points from the user
            const updatedPoints = await decreaseUserPoints(guildId, targetUserId, pointsValue)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Removed **${pointsValue}** points from <@${targetUserId}>. They now have **${updatedPoints.points}** points.`,
                allowed_mentions: { parse: [] }, // Prevent user ping
              },
            })
          } catch (error) {
            console.error("Error removing points:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to remove points. Please try again later.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "reset") {
          const userOption = subCommandOptions.find((opt) => opt.name === "user")
          const targetUserId = userOption?.value

          try {
            if (targetUserId) {
              // Reset points for a specific user
              const userResponse = await discordRequest(`users/${targetUserId}`, {
                method: "GET",
              })
              const user = await userResponse.json()

              await resetUserPoints(guildId, targetUserId)

              return NextResponse.json({
                type: CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: `Reset <@${targetUserId}>'s points to 0.`,
                  allowed_mentions: { parse: [] }, // Prevent user ping
                },
              })
            } else {
              // Reset all points in the guild
              const count = await resetAllPoints(guildId)

              return NextResponse.json({
                type: CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: `Reset points for all users in the server. Affected ${count} users.`,
                },
              })
            }
          } catch (error) {
            console.error("Error resetting points:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to reset points. Please try again later.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "role") {
          const roleOption = subCommandOptions.find((opt) => opt.name === "role")

          if (!roleOption) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Please specify a role.",
                flags: 64,
              },
            })
          }

          const roleId = roleOption.value

          try {
            // Get role information
            const rolesResponse = await discordRequest(`guilds/${guildId}/roles`, {
              method: "GET",
            })

            const roles = await rolesResponse.json()
            const role = roles.find((r) => r.id === roleId)

            // Get points for users with this role
            const usersWithRole = await getPointsByRole(guildId, roleId)

            if (usersWithRole.length === 0) {
              return NextResponse.json({
                type: CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: `No users with the <@&${roleId}> role have any points.`,
                  allowed_mentions: { parse: [] }, // Prevent role ping
                  flags: 64,
                },
              })
            }

            // Format the response
            const usersList = await Promise.all(
              usersWithRole.slice(0, 10).map(async (userPoints, index) => {
                try {
                  const userResponse = await discordRequest(`users/${userPoints.userId}`, {
                    method: "GET",
                  })
                  const user = await userResponse.json()
                  return `${index + 1}. <@${userPoints.userId}> (${user.username}): **${userPoints.points}** points`
                } catch (error) {
                  return `${index + 1}. <@${userPoints.userId}>: **${userPoints.points}** points`
                }
              }),
            )

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `**Points for users with the ${role ? role.name : roleId} role:**\n\n${usersList.join("\n")}${
                  usersWithRole.length > 10 ? `\n\n*and ${usersWithRole.length - 10} more users...*` : ""
                }`,
                allowed_mentions: { parse: [] }, // Prevent user pings
                flags: 64,
              },
            })
          } catch (error) {
            console.error("Error getting points by role:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to get points by role. Please try again later.",
                flags: 64,
              },
            })
          }
        }
      }

      // Handle leaderboard command
      else if (name === "leaderboard") {
        const limitOption = options.find((opt) => opt.name === "limit")
        const limit = limitOption?.value || 10 // Default to 10 if not specified

        try {
          // Get the leaderboard data
          const leaderboardData = await getLeaderboard(guildId, limit)

          if (leaderboardData.length === 0) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "No users have any points yet.",
              },
            })
          }

          // Get user information for each user in the leaderboard
          const leaderboardWithUserInfo = await Promise.all(
            leaderboardData.map(async (entry, index) => {
              try {
                const userResponse = await discordRequest(`users/${entry.userId}`, {
                  method: "GET",
                })
                const user = await userResponse.json()
                return {
                  ...entry,
                  username: user.username,
                  avatar: user.avatar,
                  position: index + 1,
                }
              } catch (error) {
                return {
                  ...entry,
                  username: "Unknown User",
                  position: index + 1,
                }
              }
            }),
          )

          // Create the leaderboard embed
          const embed = {
            title: "📊 Guild Score Leaderboards",
            color: 0x5865f2, // Discord blurple
            description:
              "**TEXT SCORE [1/6]**\n" +
              leaderboardWithUserInfo
                .map((entry) => `#${entry.position} | <@${entry.userId}> XP: ${entry.points}`)
                .join("\n"),
            footer: {
              text: "Powered by Hammy Bot",
            },
            timestamp: new Date().toISOString(),
          }

          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              embeds: [embed],
              allowed_mentions: { parse: [] }, // Prevent user pings
              flags: 64, // Ephemeral flag - only visible to the command user
            },
          })
        } catch (error) {
          console.error("Error getting leaderboard:", error)
          return NextResponse.json({
            type: CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "Failed to get leaderboard. Please try again later.",
              flags: 64,
            },
          })
        }
      }
      // Add the XP command handler after the leaderboard command handler
      // Find the leaderboard command handler and add this after it:

      // Handle XP command
      else if (name === "xp") {
        const subCommand = options[0].name
        const subCommandOptions = options[0].options || []

        // Check if user has permission to manage XP (except for stats)
        if (subCommand !== "stats" && subCommand !== "status") {
          const hasPermission = await canManagePoints(guildId, moderator.id)
          if (!hasPermission) {
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "You don't have permission to manage the XP system.",
                flags: 64, // Ephemeral flag
              },
            })
          }
        }

        if (subCommand === "config") {
          try {
            // Get current config
            const currentConfig = await getXpConfig(guildId)

            // Prepare update data
            const updateData = {}

            // Process each option
            for (const option of subCommandOptions) {
              switch (option.name) {
                case "voice_enabled":
                  updateData.voiceXpEnabled = option.value
                  break
                case "voice_per_minute":
                  updateData.voiceXpPerMinute = option.value
                  break
                case "voice_cooldown":
                  updateData.voiceXpCooldown = option.value
                  break
                case "media_enabled":
                  updateData.mediaXpEnabled = option.value
                  break
                case "media_amount":
                  updateData.mediaXpAmount = option.value
                  break
                case "media_cooldown":
                  updateData.mediaXpCooldown = option.value
                  break
              }
            }

            // Update config if there are changes
            if (Object.keys(updateData).length > 0) {
              await updateXpConfig(guildId, updateData)
            }

            // Get updated config
            const updatedConfig = await getXpConfig(guildId)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `XP system configuration updated:
- Voice XP: ${updatedConfig.voiceXpEnabled ? "Enabled" : "Disabled"}
- Voice XP per minute: ${updatedConfig.voiceXpPerMinute}
- Voice XP cooldown: ${updatedConfig.voiceXpCooldown} minutes
- Media XP: ${updatedConfig.mediaXpEnabled ? "Enabled" : "Disabled"}
- Media XP per submission: ${updatedConfig.mediaXpAmount}
- Media XP cooldown: ${updatedConfig.mediaXpCooldown} minutes
- Media channels: ${updatedConfig.mediaChannels.length > 0 ? updatedConfig.mediaChannels.map((id) => `<#${id}>`).join(", ") : "None configured"}`,
                flags: 64, // Ephemeral flag
              },
            })
          } catch (error) {
            console.error("Error updating XP config:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to update XP configuration. Please try again later.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "media_channel") {
          try {
            const channelOption = subCommandOptions.find((opt) => opt.name === "channel")
            const enabledOption = subCommandOptions.find((opt) => opt.name === "enabled")

            if (!channelOption || enabledOption === undefined) {
              return NextResponse.json({
                type: CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: "Please specify both a channel and whether to enable or disable XP.",
                  flags: 64,
                },
              })
            }

            const channelId = channelOption.value
            const enabled = enabledOption.value

            // Get current config
            const config = await getXpConfig(guildId)
            let mediaChannels = [...(config.mediaChannels || [])]

            if (enabled) {
              // Add channel if not already in the list
              if (!mediaChannels.includes(channelId)) {
                mediaChannels.push(channelId)
              }
            } else {
              // Remove channel if in the list
              mediaChannels = mediaChannels.filter((id) => id !== channelId)
            }

            // Update config
            await updateXpConfig(guildId, { mediaChannels })

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `${enabled ? "Added" : "Removed"} <#${channelId}> ${enabled ? "to" : "from"} media XP channels.`,
                flags: 64, // Ephemeral flag
              },
            })
          } catch (error) {
            console.error("Error updating media channels:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to update media channels. Please try again later.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "stats") {
          try {
            const userOption = subCommandOptions.find((opt) => opt.name === "user")
            const targetUserId = userOption?.value || moderator.id // If no user specified, show the command user's stats

            // Get user information
            const userResponse = await discordRequest(`users/${targetUserId}`, {
              method: "GET",
            })
            const user = await userResponse.json()

            // Get points
            const points = await getUserPoints(guildId, targetUserId)

            // Get voice stats
            const voiceStats = await getUserVoiceStats(guildId, targetUserId)

            // Get media stats
            const mediaStats = await getUserMediaStats(guildId, targetUserId)

            // Format time
            const hours = voiceStats ? Math.floor(voiceStats.totalSeconds / 3600) : 0
            const minutes = voiceStats ? Math.floor((voiceStats.totalSeconds % 3600) / 60) : 0
            const formattedTime = `${hours}h ${minutes}m`

            // Create embed
            const embed = {
              title: `XP Stats for ${user.username}`,
              color: 0x5865f2, // Discord blurple
              fields: [
                {
                  name: "Total Points",
                  value: `${points} XP`,
                  inline: true,
                },
                {
                  name: "Voice Time",
                  value: voiceStats ? formattedTime : "None",
                  inline: true,
                },
                {
                  name: "Voice Sessions",
                  value: voiceStats ? `${voiceStats.totalSessions}` : "0",
                  inline: true,
                },
                {
                  name: "Media Submissions",
                  value: mediaStats ? `${mediaStats.totalSubmissions}` : "0",
                  inline: true,
                },
                {
                  name: "Media XP Earned",
                  value: mediaStats ? `${mediaStats.totalXp} XP` : "0 XP",
                  inline: true,
                },
              ],
              thumbnail: {
                url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
              },
              footer: {
                text: "Powered by Hammy Bot",
              },
              timestamp: new Date().toISOString(),
            }

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                embeds: [embed],
                allowed_mentions: { parse: [] }, // Prevent user pings
                flags: 64, // Ephemeral flag
              },
            })
          } catch (error) {
            console.error("Error getting XP stats:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to get XP stats. Please try again later.",
                flags: 64,
              },
            })
          }
        } else if (subCommand === "status") {
          try {
            // Get current config
            const config = await getXpConfig(guildId)

            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                embeds: [
                  {
                    title: "XP System Configuration",
                    color: 0x5865f2, // Discord blurple
                    fields: [
                      {
                        name: "Voice XP",
                        value: config.voiceXpEnabled ? "Enabled" : "Disabled",
                        inline: true,
                      },
                      {
                        name: "Voice XP Rate",
                        value: `${config.voiceXpPerMinute} XP per minute`,
                        inline: true,
                      },
                      {
                        name: "Voice XP Cooldown",
                        value: `${config.voiceXpCooldown} minutes`,
                        inline: true,
                      },
                      {
                        name: "Media XP",
                        value: config.mediaXpEnabled ? "Enabled" : "Disabled",
                        inline: true,
                      },
                      {
                        name: "Media XP Amount",
                        value: `${config.mediaXpAmount} XP per submission`,
                        inline: true,
                      },
                      {
                        name: "Media XP Cooldown",
                        value: `${config.mediaXpCooldown} minutes`,
                        inline: true,
                      },
                      {
                        name: "Media Channels",
                        value:
                          config.mediaChannels.length > 0
                            ? config.mediaChannels.map((id) => `<#${id}>`).join(", ")
                            : "None configured (all channels)",
                      },
                    ],
                    footer: {
                      text: "Powered by Hammy Bot",
                    },
                    timestamp: new Date().toISOString(),
                  },
                ],
                flags: 64, // Ephemeral flag
              },
            })
          } catch (error) {
            console.error("Error getting XP config:", error)
            return NextResponse.json({
              type: CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Failed to get XP configuration. Please try again later.",
                flags: 64,
              },
            })
          }
        }
      }

      // Default response for unhandled commands
      else {
        return NextResponse.json({
          type: CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "Command not recognized or missing required options." },
        })
      }
    }

    // Default response for unhandled interaction types
    console.log("Unhandled interaction type")
    return NextResponse.json({
      type: CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Unhandled interaction type." },
    })
  } catch (error) {
    console.error("Error processing interaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
