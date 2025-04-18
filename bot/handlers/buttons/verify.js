const { createLogEmbed } = require("../../utils/logging")
const { sendLogMessage } = require("../../services/logging")

// Handle verify button click
async function handleVerifyButton(interaction) {
  const { customId, guild, user } = interaction
  const roleId = customId.replace("verify_", "")

  try {
    // Get the member
    const member = await guild.members.fetch(user.id)

    // Add the role to the user
    await member.roles.add(roleId)

    // Get role information for logging
    const role = await guild.roles.fetch(roleId)

    // Create moderator info for logging
    const moderator = {
      id: "BOT",
      username: "Verification System",
    }

    // Send log if logging is enabled
    const logEmbed = createLogEmbed("role add", moderator, user, "User verified themselves", {
      Role: role ? `${role.name} (${role.id})` : roleId,
    })

    await sendLogMessage(guild.id, logEmbed)

    // Respond with an ephemeral message
    await interaction.reply({
      content: `✅ You have been verified and given the ${role ? role.name : "verification"} role!`,
      ephemeral: true,
    })
  } catch (error) {
    console.error("Error verifying user:", error)

    await interaction.reply({
      content: "❌ There was an error verifying you. Please contact a server administrator.",
      ephemeral: true,
    })
  }
}

module.exports = {
  handleVerifyButton,
}
