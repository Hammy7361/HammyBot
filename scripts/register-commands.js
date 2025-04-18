const { REST, Routes } = require("discord.js")
require("dotenv").config()

// Command definitions
const commands = [
  {
    name: "role",
    description: "Manage roles for users",
    options: [
      {
        type: 1, // SUB_COMMAND
        name: "add",
        description: "Add a role to a user",
        options: [
          {
            type: 6, // USER
            name: "user",
            description: "The user to add the role to",
            required: true,
          },
          {
            type: 8, // ROLE
            name: "role",
            description: "The role to add",
            required: true,
          },
        ],
      },
      {
        type: 1, // SUB_COMMAND
        name: "remove",
        description: "Remove a role from a user",
        options: [
          {
            type: 6, // USER
            name: "user",
            description: "The user to remove the role from",
            required: true,
          },
          {
            type: 8, // ROLE
            name: "role",
            description: "The role to remove",
            required: true,
          },
        ],
      },
    ],
  },
]

// Create REST instance
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN)

// Register commands
;(async () => {
  try {
    console.log("Started refreshing application (/) commands.")

    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands })

    console.log("Successfully reloaded application (/) commands.")
  } catch (error) {
    console.error(error)
  }
})()
