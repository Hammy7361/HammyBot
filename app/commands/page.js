import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CommandsPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hammy Bot Commands</h1>
          <p className="text-gray-600 dark:text-gray-300">A complete list of all available commands</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <CommandSection
            title="Role Management"
            description="Commands for managing roles in your server"
            commands={[
              { name: "/role add @user @role", description: "Add a role to a user" },
              { name: "/role remove @user @role", description: "Remove a role from a user" },
            ]}
          />

          <CommandSection
            title="Moderation"
            description="Commands for moderating your server"
            commands={[
              { name: "/purge [amount]", description: "Delete a specified number of messages (1-100)" },
              { name: "/warn @user [reason] [anonymous]", description: "Warn a user with a specified reason" },
              { name: "/kick @user [reason]", description: "Kick a user from the server" },
              { name: "/ban @user [reason] [days]", description: "Ban a user from the server" },
            ]}
          />

          <CommandSection
            title="Warning System"
            description="Commands for managing warnings"
            commands={[
              { name: "/warnings @user", description: "View all warnings for a user" },
              {
                name: "/clearwarnings @user [warning_id]",
                description: "Clear all warnings for a user or a specific warning by ID",
              },
            ]}
          />

          <CommandSection
            title="Logging"
            description="Commands for configuring logging"
            commands={[
              { name: "/logging set #channel", description: "Sets the channel where moderation logs will be sent" },
              { name: "/logging disable", description: "Disables logging for the server" },
              { name: "/logging status", description: "Shows the current logging status and channel" },
            ]}
          />

          <CommandSection
            title="Verification"
            description="Commands for setting up verification"
            commands={[
              {
                name: "/verify @role [title] [description] [button_text] [color]",
                description: "Creates a verification embed with a button",
              },
            ]}
          />

          <CommandSection
            title="GitHub Integration"
            description="Commands for GitHub integration"
            commands={[
              { name: "/github", description: "Get a link to the bot's GitHub repository" },
              {
                name: "/github-webhook setup [repository] [#channel] [events]",
                description: "Set up GitHub webhook notifications for a repository",
              },
              { name: "/github-webhook list", description: "List all GitHub webhook integrations for the server" },
              {
                name: "/github-webhook remove [repository]",
                description: "Remove GitHub webhook integration for a repository",
              },
            ]}
          />

          <CommandSection
            title="Starboard"
            description="Commands for configuring the starboard"
            commands={[
              {
                name: "/starboard setup #channel [threshold] [emoji]",
                description: "Set up the starboard in a specific channel",
              },
              { name: "/starboard disable", description: "Disable the starboard for this server" },
              { name: "/starboard status", description: "Check the current starboard status and configuration" },
            ]}
          />
        </div>
      </main>
    </div>
  )
}

function CommandSection({ title, description, commands }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commands.map((command, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
              <p className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-1 rounded inline-block mb-1">
                {command.name}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{command.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
