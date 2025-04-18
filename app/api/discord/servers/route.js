import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  console.log("Fetching servers...")
  const authCookie = cookies().get("discord_auth")

  if (!authCookie) {
    console.error("No auth cookie found")
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const authData = JSON.parse(authCookie.value)

    // Check if the token is expired
    if (authData.expires_at < Date.now()) {
      console.error("Auth token expired")
      return NextResponse.json({ error: "Token expired" }, { status: 401 })
    }

    // Filter guilds where the user has admin permissions
    // The permission for Administrator is 0x8 (8)
    const adminGuilds = authData.guilds.filter((guild) => (guild.permissions & 0x8) === 0x8 || guild.owner)

    console.log(`User has admin permissions in ${adminGuilds.length} guilds`)

    // Get the bot's guilds
    // We'll use the Discord bot token to get the list of guilds the bot is in
    const botGuildsResponse = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    })

    if (!botGuildsResponse.ok) {
      console.error("Failed to fetch bot guilds:", await botGuildsResponse.text())
      // If we can't fetch bot guilds, just return admin guilds
      return NextResponse.json(adminGuilds)
    }

    const botGuilds = await botGuildsResponse.json()
    console.log(`Bot is in ${botGuilds.length} guilds`)

    // Get the guild IDs where the bot is installed
    const botGuildIds = new Set(botGuilds.map((guild) => guild.id))

    // Filter admin guilds to only include those where the bot is installed
    const managedGuilds = adminGuilds.filter((guild) => botGuildIds.has(guild.id))

    console.log(`User can manage ${managedGuilds.length} guilds with the bot installed`)

    // Return the filtered guilds
    return NextResponse.json(managedGuilds)
  } catch (error) {
    console.error("Error fetching servers:", error)
    return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 })
  }
}
