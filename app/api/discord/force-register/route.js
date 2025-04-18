import { NextResponse } from "next/server"
import { registerCommands } from "../../../../lib/discord"
import { ALL_COMMANDS } from "../../../../lib/commands"

// This endpoint forces re-registration of all slash commands with Discord
export async function GET() {
  try {
    console.log("Force registering all commands...")

    // First, try to register commands globally (may take up to an hour to propagate)
    const response = await registerCommands(ALL_COMMANDS)

    // Create a more detailed response
    const commandDetails = ALL_COMMANDS.map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options ? cmd.options.length : 0,
    }))

    return NextResponse.json({
      success: true,
      message: "Commands force-registered successfully! It may take up to an hour for global commands to appear.",
      registeredAt: new Date().toISOString(),
      commandCount: response.length,
      commands: commandDetails,
    })
  } catch (error) {
    console.error("Error force-registering commands:", error)
    return NextResponse.json(
      {
        error: "Failed to force-register commands",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
