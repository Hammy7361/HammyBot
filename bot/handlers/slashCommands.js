const { handleRoleCommand } = require("./commands/role")
const { handlePurgeCommand } = require("./commands/purge")
const { handleWarnCommand } = require("./commands/warn")
const { handleKickCommand } = require("./commands/kick")
const { handleBanCommand } = require("./commands/ban")
const { handleLoggingCommand } = require("./commands/logging")
const { handleGithubCommand } = require("./commands/github")
const { handleListeningCommand } = require("./commands/listening")
const { handleVerifyCommand } = require("./commands/verify")
const { handleGithubWebhookCommand } = require("./commands/githubWebhook")
const { handleWarningsCommand } = require("./commands/warnings")
const { handleClearWarningsCommand } = require("./commands/clearWarnings")
const { handleStarboardCommand } = require("./commands/starboard")
const { handlePointsCommand } = require("./commands/points")
const { handleLeaderboardCommand } = require("./commands/leaderboard")
const { handleXpCommand } = require("./commands/xp")

// Main slash command handler
async function handleSlashCommand(interaction) {
  const { commandName } = interaction

  try {
    // Route to the appropriate command handler
    switch (commandName) {
      case "role":
        await handleRoleCommand(interaction)
        break
      case "purge":
        await handlePurgeCommand(interaction)
        break
      case "warn":
        await handleWarnCommand(interaction)
        break
      case "kick":
        await handleKickCommand(interaction)
        break
      case "ban":
        await handleBanCommand(interaction)
        break
      case "logging":
        await handleLoggingCommand(interaction)
        break
      case "github":
        await handleGithubCommand(interaction)
        break
      case "listening":
        await handleListeningCommand(interaction)
        break
      case "verify":
        await handleVerifyCommand(interaction)
        break
      case "github-webhook":
        await handleGithubWebhookCommand(interaction)
        break
      case "warnings":
        await handleWarningsCommand(interaction)
        break
      case "clearwarnings":
        await handleClearWarningsCommand(interaction)
        break
      case "starboard":
        await handleStarboardCommand(interaction)
        break
      case "points":
        await handlePointsCommand(interaction)
        break
      case "leaderboard":
        await handleLeaderboardCommand(interaction)
        break
      case "xp":
        await handleXpCommand(interaction)
        break
      default:
        await interaction.reply({
          content: `Command not implemented: ${commandName}`,
          ephemeral: true,
        })
    }
  } catch (error) {
    console.error(`Error handling command ${commandName}:`, error)

    // Reply with an error message if the interaction hasn't been acknowledged
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      })
    }
  }
}

module.exports = {
  handleSlashCommand,
}
