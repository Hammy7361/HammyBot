import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Mark this route as dynamic to prevent static generation
export const dynamic = "force-dynamic"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    console.error("Missing authorization code")
    return NextResponse.redirect(new URL("/dashboard/login?error=missing_code", request.url))
  }

  try {
    console.log("Exchanging code for token...")

    // Exchange the code for an access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri:
          process.env.NEXT_PUBLIC_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/callback/discord`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange error:", errorText)
      return NextResponse.redirect(new URL("/dashboard/login?error=token_exchange", request.url))
    }

    const tokenData = await tokenResponse.json()
    console.log("Token received successfully")

    // Get the user's information
    console.log("Fetching user data...")
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error("User fetch error:", await userResponse.text())
      return NextResponse.redirect(new URL("/dashboard/login?error=user_fetch", request.url))
    }

    const userData = await userResponse.json()
    console.log("User data fetched successfully:", userData.username)

    // Get the user's guilds
    console.log("Fetching guilds data...")
    const guildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!guildsResponse.ok) {
      console.error("Guilds fetch error:", await guildsResponse.text())
      return NextResponse.redirect(new URL("/dashboard/login?error=guilds_fetch", request.url))
    }

    const guildsData = await guildsResponse.json()
    console.log(`Fetched ${guildsData.length} guilds`)

    // Get the bot's guilds
    console.log("Fetching bot guilds...")
    const botGuildsResponse = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    })

    let botGuilds = []
    if (botGuildsResponse.ok) {
      botGuilds = await botGuildsResponse.json()
      console.log(`Bot is in ${botGuilds.length} guilds`)
    } else {
      console.error("Failed to fetch bot guilds:", await botGuildsResponse.text())
    }

    // Filter guilds where the user has admin permissions
    const adminGuilds = guildsData.filter((guild) => (guild.permissions & 0x8) === 0x8 || guild.owner)

    console.log(`User has admin permissions in ${adminGuilds.length} guilds`)

    // Get the guild IDs where the bot is installed
    const botGuildIds = new Set(botGuilds.map((guild) => guild.id))

    // Filter admin guilds to only include those where the bot is installed
    const managedGuilds = adminGuilds.filter((guild) => botGuildIds.has(guild.id))

    console.log(`User can manage ${managedGuilds.length} guilds with the bot installed`)

    // Store auth data in a cookie
    const authData = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      user: userData,
      guilds: managedGuilds,
    }

    // Set the cookie with the auth data
    cookies().set({
      name: "discord_auth",
      value: JSON.stringify(authData),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in,
      path: "/",
    })

    // Redirect to the servers page
    return NextResponse.redirect(new URL("/dashboard/servers", new URL(request.url).origin))
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(new URL("/dashboard/login?error=server_error", request.url))
  }
}
