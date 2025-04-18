const { startVoiceSession, endVoiceSession } = require("../services/xp")

// Handle voice state update event
async function handleVoiceStateUpdate(oldState, newState) {
  const { guild, member } = newState

  if (!guild || !member) {
    return
  }

  const userId = member.id
  const guildId = guild.id

  // User joined a voice channel
  if (!oldState.channelId && newState.channelId) {
    console.log(`User ${userId} joined voice channel ${newState.channelId} in guild ${guildId}`)
    await startVoiceSession(guildId, userId, newState.channelId)
  }
  // User left a voice channel
  else if (oldState.channelId && !newState.channelId) {
    console.log(`User ${userId} left voice channel ${oldState.channelId} in guild ${guildId}`)
    await endVoiceSession(guildId, userId, oldState.channelId)
  }
  // User switched voice channels
  else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    console.log(
      `User ${userId} switched from voice channel ${oldState.channelId} to ${newState.channelId} in guild ${guildId}`,
    )
    await endVoiceSession(guildId, userId, oldState.channelId)
    await startVoiceSession(guildId, userId, newState.channelId)
  }
}

module.exports = {
  handleVoiceStateUpdate,
}
