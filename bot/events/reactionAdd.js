const { processStarboardReaction } = require("../services/starboard")

// Handle reaction add event
async function handleReactionAdd(reaction, user) {
  // Ignore bot reactions
  if (user.bot) {
    return
  }

  try {
    // Make sure the reaction and message are fully fetched
    if (reaction.partial) {
      await reaction.fetch()
    }

    if (reaction.message.partial) {
      await reaction.message.fetch()
    }

    const { message } = reaction

    // Process for starboard if in a guild
    if (message.guild) {
      await processStarboardReaction(message.guild.id, message.channel.id, message.id, reaction.emoji, user.id)
    }
  } catch (error) {
    console.error("Error handling reaction add:", error)
  }
}

module.exports = {
  handleReactionAdd,
}
