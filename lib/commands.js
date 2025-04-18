// Define the slash commands for the bot
export const ROLE_COMMAND = {
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
}

export const PURGE_COMMAND = {
  name: "purge",
  description: "Delete a number of messages from the channel",
  options: [
    {
      type: 4, // INTEGER
      name: "amount",
      description: "The number of messages to delete (1-100)",
      required: true,
      min_value: 1,
      max_value: 100,
    },
  ],
}

export const WARN_COMMAND = {
  name: "warn",
  description: "Warn a user",
  options: [
    {
      type: 6, // USER
      name: "user",
      description: "The user to warn",
      required: true,
    },
    {
      type: 3, // STRING
      name: "reason",
      description: "The reason for the warning",
      required: true,
    },
    {
      type: 5, // BOOLEAN
      name: "anonymous",
      description: "Send the warning anonymously (default: true)",
      required: false,
    },
  ],
}

export const KICK_COMMAND = {
  name: "kick",
  description: "Kick a user from the server",
  options: [
    {
      type: 6, // USER
      name: "user",
      description: "The user to kick",
      required: true,
    },
    {
      type: 3, // STRING
      name: "reason",
      description: "The reason for kicking the user",
      required: false,
    },
  ],
}

export const BAN_COMMAND = {
  name: "ban",
  description: "Ban a user from the server",
  options: [
    {
      type: 6, // USER
      name: "user",
      description: "The user to ban",
      required: true,
    },
    {
      type: 3, // STRING
      name: "reason",
      description: "The reason for banning the user",
      required: false,
    },
    {
      type: 4, // INTEGER
      name: "days",
      description: "Number of days of messages to delete (0-7)",
      required: false,
      min_value: 0,
      max_value: 7,
    },
  ],
}

export const LOGGING_COMMAND = {
  name: "logging",
  description: "Configure logging settings",
  options: [
    {
      type: 1, // SUB_COMMAND
      name: "set",
      description: "Set the logging channel",
      options: [
        {
          type: 7, // CHANNEL
          name: "channel",
          description: "The channel to send logs to",
          required: true,
          channel_types: [0], // Text channels only
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "disable",
      description: "Disable logging",
    },
    {
      type: 1, // SUB_COMMAND
      name: "status",
      description: "Check the current logging status",
    },
  ],
}

export const GITHUB_COMMAND = {
  name: "github",
  description: "Get the link to the bot's GitHub repository",
}

export const LISTENING_COMMAND = {
  name: "listening",
  description: "Show what a user is currently listening to",
  options: [
    {
      type: 6, // USER
      name: "user",
      description: "The user to check what they're listening to",
      required: true,
    },
  ],
}

export const VERIFY_COMMAND = {
  name: "verify",
  description: "Create a verification embed with a button",
  options: [
    {
      type: 8, // ROLE
      name: "role",
      description: "The role to give when users verify",
      required: true,
    },
    {
      type: 3, // STRING
      name: "title",
      description: "The title of the verification embed",
      required: false,
    },
    {
      type: 3, // STRING
      name: "description",
      description: "The description of the verification embed",
      required: false,
    },
    {
      type: 3, // STRING
      name: "button_text",
      description: "The text to display on the verification button",
      required: false,
    },
    {
      type: 3, // STRING
      name: "color",
      description: "The color of the embed (hex code)",
      required: false,
    },
  ],
}

export const GITHUB_WEBHOOK_COMMAND = {
  name: "github-webhook",
  description: "Manage GitHub webhook notifications",
  options: [
    {
      type: 1, // SUB_COMMAND
      name: "setup",
      description: "Set up GitHub webhook notifications for a repository",
      options: [
        {
          type: 3, // STRING
          name: "repository",
          description: "The GitHub repository (format: owner/repo)",
          required: true,
        },
        {
          type: 7, // CHANNEL
          name: "channel",
          description: "The channel to send notifications to",
          required: true,
          channel_types: [0], // Text channels only
        },
        {
          type: 3, // STRING
          name: "events",
          description: "Events to notify (comma-separated: push,pr,issue,release,all)",
          required: false,
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "list",
      description: "List all GitHub webhook integrations for this server",
    },
    {
      type: 1, // SUB_COMMAND
      name: "remove",
      description: "Remove GitHub webhook integration for a repository",
      options: [
        {
          type: 3, // STRING
          name: "repository",
          description: "The GitHub repository to remove (format: owner/repo)",
          required: true,
        },
      ],
    },
  ],
}

export const WARNINGS_COMMAND = {
  name: "warnings",
  description: "View warnings for a user",
  options: [
    {
      type: 6, // USER
      name: "user",
      description: "The user to view warnings for",
      required: true,
    },
  ],
}

export const CLEARWARNINGS_COMMAND = {
  name: "clearwarnings",
  description: "Clear warnings for a user",
  options: [
    {
      type: 6, // USER
      name: "user",
      description: "The user to clear warnings for",
      required: true,
    },
    {
      type: 3, // STRING
      name: "warning_id",
      description: "Specific warning ID to clear (leave empty to clear all)",
      required: false,
    },
  ],
}

export const STARBOARD_COMMAND = {
  name: "starboard",
  description: "Configure the starboard",
  options: [
    {
      type: 1, // SUB_COMMAND
      name: "setup",
      description: "Set up the starboard",
      options: [
        {
          type: 7, // CHANNEL
          name: "channel",
          description: "The channel to use for the starboard",
          required: true,
          channel_types: [0], // Text channels only
        },
        {
          type: 4, // INTEGER
          name: "threshold",
          description: "Number of stars needed to appear on the starboard (default: 3)",
          required: false,
          min_value: 1,
          max_value: 100,
        },
        {
          type: 3, // STRING
          name: "emoji",
          description: "The emoji to use for stars (default: ⭐)",
          required: false,
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "disable",
      description: "Disable the starboard",
    },
    {
      type: 1, // SUB_COMMAND
      name: "status",
      description: "Check the current starboard status",
    },
  ],
}

// New points command
export const POINTS_COMMAND = {
  name: "points",
  description: "Manage server points system",
  options: [
    {
      type: 1, // SUB_COMMAND
      name: "view",
      description: "View points for a user",
      options: [
        {
          type: 6, // USER
          name: "user",
          description: "The user to view points for (leave empty to view your own)",
          required: false,
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "set",
      description: "Set points for a user",
      options: [
        {
          type: 6, // USER
          name: "user",
          description: "The user to set points for",
          required: true,
        },
        {
          type: 4, // INTEGER
          name: "points",
          description: "The number of points to set",
          required: true,
          min_value: 0,
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "add",
      description: "Add points to a user",
      options: [
        {
          type: 6, // USER
          name: "user",
          description: "The user to add points to",
          required: true,
        },
        {
          type: 4, // INTEGER
          name: "points",
          description: "The number of points to add",
          required: true,
          min_value: 1,
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "remove",
      description: "Remove points from a user",
      options: [
        {
          type: 6, // USER
          name: "user",
          description: "The user to remove points from",
          required: true,
        },
        {
          type: 4, // INTEGER
          name: "points",
          description: "The number of points to remove",
          required: true,
          min_value: 1,
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "reset",
      description: "Reset points for a user or all users",
      options: [
        {
          type: 6, // USER
          name: "user",
          description: "The user to reset points for (leave empty to reset all)",
          required: false,
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "role",
      description: "View points for users with a specific role",
      options: [
        {
          type: 8, // ROLE
          name: "role",
          description: "The role to filter by",
          required: true,
        },
      ],
    },
  ],
}

// New leaderboard command
export const LEADERBOARD_COMMAND = {
  name: "leaderboard",
  description: "Show the server points leaderboard",
  options: [
    {
      type: 4, // INTEGER
      name: "limit",
      description: "Number of users to show (default: 10)",
      required: false,
      min_value: 1,
      max_value: 25,
    },
  ],
}

// Add this new command after the LEADERBOARD_COMMAND

export const XP_COMMAND = {
  name: "xp",
  description: "Manage the XP system",
  options: [
    {
      type: 1, // SUB_COMMAND
      name: "config",
      description: "Configure the XP system",
      options: [
        {
          type: 5, // BOOLEAN
          name: "voice_enabled",
          description: "Enable/disable voice XP",
          required: false,
        },
        {
          type: 4, // INTEGER
          name: "voice_per_minute",
          description: "XP awarded per minute in voice",
          required: false,
          min_value: 1,
          max_value: 10,
        },
        {
          type: 4, // INTEGER
          name: "voice_cooldown",
          description: "Cooldown between voice XP awards (minutes)",
          required: false,
          min_value: 1,
          max_value: 60,
        },
        {
          type: 5, // BOOLEAN
          name: "media_enabled",
          description: "Enable/disable media submission XP",
          required: false,
        },
        {
          type: 4, // INTEGER
          name: "media_amount",
          description: "XP awarded per media submission",
          required: false,
          min_value: 1,
          max_value: 50,
        },
        {
          type: 4, // INTEGER
          name: "media_cooldown",
          description: "Cooldown between media XP awards (minutes)",
          required: false,
          min_value: 1,
          max_value: 1440, // 24 hours
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "media_channel",
      description: "Add or remove a media channel for XP rewards",
      options: [
        {
          type: 7, // CHANNEL
          name: "channel",
          description: "The channel to configure",
          required: true,
          channel_types: [0], // Text channels only
        },
        {
          type: 5, // BOOLEAN
          name: "enabled",
          description: "Enable or disable XP for this channel",
          required: true,
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "stats",
      description: "View XP statistics for a user",
      options: [
        {
          type: 6, // USER
          name: "user",
          description: "The user to view stats for (leave empty for yourself)",
          required: false,
        },
      ],
    },
    {
      type: 1, // SUB_COMMAND
      name: "status",
      description: "View the current XP system configuration",
    },
  ],
}

// Update the ALL_COMMANDS array to include the new XP_COMMAND
export const ALL_COMMANDS = [
  ROLE_COMMAND,
  PURGE_COMMAND,
  WARN_COMMAND,
  KICK_COMMAND,
  BAN_COMMAND,
  LOGGING_COMMAND,
  GITHUB_COMMAND,
  LISTENING_COMMAND,
  VERIFY_COMMAND,
  GITHUB_WEBHOOK_COMMAND,
  WARNINGS_COMMAND,
  CLEARWARNINGS_COMMAND,
  STARBOARD_COMMAND,
  POINTS_COMMAND,
  LEADERBOARD_COMMAND,
  XP_COMMAND,
]
