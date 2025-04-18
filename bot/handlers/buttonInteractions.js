const { handleVerifyButton } = require("./buttons/verify")

// Main button interaction handler
async function handleButtonInteraction(interaction) {
  const { customId } = interaction

  try {
    // Handle verification button
    if (customId.startsWith("verify_")) {
      await handleVerifyButton(interaction)
      return
    }

    // Handle other button types as needed
    // ...

    // Default response for unhandled button
    await interaction.reply({
      content: "This button interaction is not supported.",
      ephemeral: true,
    })
  } catch (error) {
    console.error(`Error handling button interaction ${customId}:`, error)

    // Reply with an error message if the interaction hasn't been acknowledged
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "There was an error processing this button!",
        ephemeral: true,
      })
    }
  }
}

module.exports = {
  handleButtonInteraction,
}
