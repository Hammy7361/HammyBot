const { recordMediaSubmission } = require("../services/xp")

// Handle message creation event
async function handleMessageCreate(message) {
  // Ignore bot messages
  if (message.author.bot || !message.guild) {
    return
  }

  // Check if message has attachments (media)
  if (message.attachments.size > 0) {
    console.log(`User ${message.author.id} posted media in channel ${message.channel.id} in guild ${message.guild.id}`)

    // Get the first attachment
    const attachment = message.attachments.first()
    let mediaType = "unknown"

    // Determine media type
    if (attachment.contentType) {
      if (attachment.contentType.startsWith("image/")) {
        mediaType = "image"
      } else if (attachment.contentType.startsWith("video/")) {
        mediaType = "video"
      } else if (attachment.contentType.startsWith("audio/")) {
        mediaType = "audio"
      }
    }

    // Record the media submission
    await recordMediaSubmission(message.guild.id, message.author.id, message.channel.id, message.id, mediaType)
  }
}

module.exports = {
  handleMessageCreate,
}
