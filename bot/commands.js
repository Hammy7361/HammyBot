const { REST, Routes, ApplicationCommandType } = require("discord.js")
const {
  ROLE_COMMAND,
  PURGE_COMMAND,
  WARN_COMMAND,
  KICK_COMMAND,
  BAN_COMMAND,
  LOGGING_COMMAND,
  GITHUB_COMMAND,
  LISTENING_COMMAND,
  VERIFY_COMMAND,
  GITHUB_WEBHOOK_COMMAND,
  WARNINGS_COMMAND,
  CLEARWARNINGS_COMMAND,
  STARBOARD_COMMAND,
  POINTS_COMMAND,
  LEADERBOARD_COMMAND,
  XP_COMMAND,
} = require("./commandDefinitions")

// All commands array
const ALL_COMMANDS = [
  ROLE_COMMAND,
  PURGE_COMMAND,
  WARN_COMMAND,
  KICK_COMMAND,
  BAN_COMMAND,
  LOGGING_COMMAND,
  GITHUB_COMMAND,
  LISTENING_COMMAND,
  VERIFY_COMMAND,
  GITHUB_WEBHOOK_COMMAND,
  WARNINGS_COMMAND,
  CLEARWARNINGS_COMMAND,
  STARBOARD_COMMAND,
  POINTS_COMMAND,
  LEADERBOARD_COMMAND,
  XP_COMMAND,
]

// Register commands with Discord
async function registerCommands(client) {
  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN)

  try {
    console.log("Started refreshing application (/) commands.")

    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: ALL_COMMANDS })

    console.log("Successfully reloaded application (/) commands.")
    return true
  } catch (error) {
    console.error("Error registering commands:", error)
    return false
  }
}

module.exports = {
  registerCommands,
  ALL_COMMANDS,
}
