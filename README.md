# Hammy Bot - Discord Moderation Bot

A powerful Discord moderation bot built with Next.js and deployed on Vercel. Hammy Bot helps server administrators manage roles, moderate their communities, integrate with GitHub repositories, and set up verification systems with easy-to-use slash commands.

![Discord Bot](https://img.shields.io/badge/Discord-Bot-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

## Features

- **Role Management**: Add and remove roles from users
- **Moderation Commands**: Warn, kick, ban users and purge messages
- **Logging System**: Log all moderation actions to a designated channel
- **Anonymous Warnings**: Option to send warnings anonymously or with moderator identification
- **Verification System**: Create customizable verification embeds with buttons
- **GitHub Integration**: Connect GitHub repositories to Discord channels for notifications
- **Automatic Command Registration**: Commands are registered automatically on deployment
- **Warning System**: Track and manage user warnings with a persistent database
- **Starboard**: Highlight popular messages in a dedicated channel
- **Points System**: Track and manage user points with a customizable leaderboard

## Database Features

The bot now includes persistent storage with PostgreSQL and Prisma, offering:

- **Warning History**: Store and retrieve user warnings, including reason, moderator, and timestamp
- **Starboard Configuration**: Configure and persist starboard settings like threshold and emoji
- **Starboard Messages**: Track starred messages and their starboard counterparts
- **Configuration Storage**: Store server-specific settings for logging channels and GitHub webhooks

## Setup Guide

### Prerequisites

- A Discord account
- A Discord server where you have administrator permissions
- A [Vercel](https://vercel.com/) account
- Node.js and npm installed (for local development)
- A GitHub account (for repository webhook integration)
- A PostgreSQL database (recommended: Vercel Postgres)

### Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under the "Privileged Gateway Intents" section, enable all intents
5. Save changes

### Step 2: Get Your Bot Tokens

1. In the "Bot" tab, click "Reset Token" and copy your bot token
2. Go to the "General Information" tab and copy your Application ID (Client ID) and Public Key
3. Go to the "OAuth2" tab, then "URL Generator"
4. Select the following scopes:
   - `bot`
   - `applications.commands`
5. Select the following bot permissions:
   - `Administrator` (or select the specific permissions below)
   - `Manage Roles`
   - `Kick Members`
   - `Ban Members`
   - `Manage Messages`
   - `Send Messages`
   - `View Channels`
6. Copy the generated URL and open it in your browser to invite the bot to your server

### Step 3: Set Up Database

1. Create a PostgreSQL database
   - **Recommended**: Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) for easy integration
   - Alternatively, use any PostgreSQL hosting service (ElephantSQL, Heroku Postgres, etc.)
2. Get your database connection string, it should look like:
   \`\`\`
   postgresql://username:password@hostname:port/database
   \`\`\`

### Step 4: Deploy to Vercel

1. Fork or clone this repository
2. Deploy to Vercel using the Vercel CLI or the Vercel GitHub integration
3. Add the following environment variables in your Vercel project settings:
   - `DISCORD_BOT_TOKEN`: Your bot token
   - `DISCORD_CLIENT_ID`: Your application ID
   - `DISCORD_PUBLIC_KEY`: Your public key (found in the "General Information" tab)
   - `GITHUB_WEBHOOK_SECRET`: A secure random string for GitHub webhook verification
   - `DATABASE_URL`: Your PostgreSQL connection string
4. Deploy the project

### Step 5: Set Up Interactions Endpoint URL

1. Go back to the Discord Developer Portal
2. In your application, go to the "General Information" tab
3. Scroll down to "Interactions Endpoint URL"
4. Enter your Vercel deployment URL followed by `/api/discord/interactions`
   - Example: `https://your-project.vercel.app/api/discord/interactions`
5. Save changes

## Commands

### Role Management

- `/role add @user @role` - Adds a role to a user
- `/role remove @user @role` - Removes a role from a user

### Moderation

- `/purge [amount]` - Deletes a specified number of messages (1-100)
- `/warn @user [reason] [anonymous]` - Warns a user with a specified reason
  - Set `anonymous` to `false` to identify yourself as the moderator
- `/kick @user [reason]` - Kicks a user from the server
- `/ban @user [reason] [days]` - Bans a user and optionally deletes their messages (0-7 days)

### Warning System

- `/warn @user [reason] [anonymous]` - Warns a user with a specified reason
  - Set `anonymous` to `false` to identify yourself as the moderator
- `/warnings @user` - View all warnings for a user
- `/clearwarnings @user [warning_id]` - Clear all warnings for a user or a specific warning by ID

### Starboard

- `/starboard setup #channel [threshold] [emoji]` - Set up the starboard in a specific channel
  - `threshold` - Number of reactions needed to appear on the starboard (default: 3)
  - `emoji` - The emoji to use for stars (default: ⭐)
- `/starboard disable` - Disable the starboard for this server
- `/starboard status` - Check the current starboard status and configuration

### Points System

- `/points view @user` - View points for a user (or yourself if no user is specified)
- `/points set @user [points]` - Set a user's points to a specific value
- `/points add @user [points]` - Add points to a user
- `/points remove @user [points]` - Remove points from a user
- `/points reset @user` - Reset a user's points to 0
- `/points reset` - Reset all points in the server
- `/points role @role` - View points for users with a specific role
- `/leaderboard [limit]` - Show the server points leaderboard

### XP System

- `/xp config` - Configure the XP system settings
  - `voice_enabled` - Enable/disable voice XP
  - `voice_per_minute` - XP awarded per minute in voice
  - `voice_cooldown` - Cooldown between voice XP awards
  - `media_enabled` - Enable/disable media submission XP
  - `media_amount` - XP awarded per media submission
  - `media_cooldown` - Cooldown between media XP awards
- `/xp media_channel #channel [enabled]` - Add or remove a channel for media XP rewards
- `/xp stats @user` - View XP statistics for a user
- `/xp status` - View the current XP system configuration

Users earn XP automatically by:
- Spending time in voice channels
- Submitting media (images, videos, etc.) in designated channels

### Logging

- `/logging set #channel` - Sets the channel where moderation logs will be sent
- `/logging disable` - Disables logging for the server
- `/logging status` - Shows the current logging status and channel

### Verification

- `/verify @role [title] [description] [button_text] [color]` - Creates a verification embed with a button
  - When users click the button, they'll automatically receive the specified role
  - Customize the title, description, button text, and embed color

### GitHub Integration

- `/github` - Get a link to the bot's GitHub repository
- `/github-webhook setup [repository] [#channel] [events]` - Set up GitHub webhook notifications for a repository
  - Events can be: push, pr, issue, release, or all (comma-separated)
- `/github-webhook list` - List all GitHub webhook integrations for the server
- `/github-webhook remove [repository]` - Remove GitHub webhook integration for a repository

## GitHub Webhook Setup

After using the `/github-webhook setup` command, you need to:

1. Go to your repository on GitHub
2. Click on "Settings" > "Webhooks" > "Add webhook"
3. Set the Payload URL to the URL provided by the bot
4. Set Content type to "application/json"
5. Set Secret to your GITHUB_WEBHOOK_SECRET environment variable
6. Select events based on your configuration
7. Click "Add webhook"

The bot will then send notifications to the specified Discord channel when events occur in your GitHub repository.

## Bot Permissions

The bot requires the following permissions to function properly:

- `Manage Roles` - For adding and removing roles, verification system
- `Kick Members` - For kicking users
- `Ban Members` - For banning users
- `Manage Messages` - For purging messages
- `View Channels` - For accessing channels
- `Send Messages` - For sending messages, logs, embeds, and GitHub notifications

**Important**: The bot's role must be higher in the role hierarchy than any roles it needs to manage.

## Local Development

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a `.env.local` file with the following variables:
   \`\`\`
   DISCORD_BOT_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_PUBLIC_KEY=your_public_key
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   DATABASE_URL=postgresql://username:password@hostname:port/database
   \`\`\`
4. Set up the database schema:
   \`\`\`bash
   npx prisma db push
   \`\`\`
5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Troubleshooting

### Commands Not Showing Up

- Make sure the bot has the `applications.commands` scope
- Check that the commands were registered by visiting `/api/discord/register` or `/api/discord/force-register`
- Commands can take up to an hour to propagate globally

### Permission Errors

- Ensure the bot has all the required permissions
- Check that the bot's role is higher in the hierarchy than the roles it's trying to manage
- For role management, the bot cannot modify roles that are higher than its own role

### Logging Not Working

- Make sure you've set up logging with `/logging set #channel`
- Verify the bot has permission to send messages in the logging channel
- Check the Vercel logs for any errors

### GitHub Webhook Issues

- Verify the GITHUB_WEBHOOK_SECRET matches between Vercel and GitHub
- Ensure the repository format is correct (owner/repo)
- Check that the bot has permission to send messages in the webhook channel
- Review GitHub webhook delivery logs for errors

### Database Issues

- Verify your DATABASE_URL is correct and properly formatted
- Make sure your database is accessible from Vercel
- Check for Prisma errors in the Vercel logs
- The database schema will be automatically created on deployment

## Technical Details

- Built with Next.js App Router
- Uses Discord Interactions API
- GitHub Webhook integration with signature verification
- Deployed on Vercel
- PostgreSQL database with Prisma ORM
- Persistent storage for moderation actions and settings

## Future Improvements

- Custom prefix commands
- Auto-moderation features
- Reaction roles
- Temporary mutes and bans
- Web dashboard
- Starboard feature
- Music commands

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you need help with the bot, please open an issue on GitHub or contact me.

---

Made with ❤️ using Next.js and Discord Interactions API
