const { InteractionType, ComponentType } = require("discord.js")
const { handleSlashCommand } = require("./handlers/slashCommands")
const { handleButtonInteraction } = require("./handlers/buttonInteractions")

// Main interaction handler
async function handleInteraction(interaction) {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    return handleSlashCommand(interaction)
  }

  // Handle button interactions
  if (interaction.isButton()) {
    return handleButtonInteraction(interaction)
  }

  // Handle other interaction types as needed
  // ...
}

module.exports = {
  handleInteraction,
}
