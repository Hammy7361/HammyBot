// This would be the main entry point for your Discord bot using discord.js
const { Client, GatewayIntentBits, Events } = require("discord.js")
const { registerCommands } = require("./commands")
const { handleInteraction } = require("./interactions")
const { handleMessageCreate } = require("./events/messageCreate")
const { handleVoiceStateUpdate } = require("./events/voiceStateUpdate")
const { handleReactionAdd } = require("./events/reactionAdd")
const prisma = require("../lib/db/prismaClient")

// Create a new client instance with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
})

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`)

  // Register slash commands
  try {
    await registerCommands(client)
    console.log("Successfully registered application commands")
  } catch (error) {
    console.error("Error registering application commands:", error)
  }
})

// Handle interactions (slash commands, buttons, etc.)
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    await handleInteraction(interaction)
  } catch (error) {
    console.error("Error handling interaction:", error)

    // Respond to the interaction if it hasn't been acknowledged yet
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      })
    }
  }
})

// Handle message creation (for media XP, etc.)
client.on(Events.MessageCreate, handleMessageCreate)

// Handle voice state updates (for voice XP)
client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate)

// Handle reaction add (for starboard)
client.on(Events.MessageReactionAdd, handleReactionAdd)

// Handle errors
client.on(Events.Error, (error) => {
  console.error("Discord client error:", error)
})

// Login to Discord with your client's token
async function startBot() {
  try {
    await client.login(process.env.DISCORD_BOT_TOKEN)
  } catch (error) {
    console.error("Failed to start bot:", error)
  }
}

// Export the client and startBot function
module.exports = { client, startBot }
