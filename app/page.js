import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  // Discord OAuth2 URL with required permissions
  const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  const redirectUri =
    process.env.NEXT_PUBLIC_REDIRECT_URI ||
    `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/discord/bot-added`
  const OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <h1 className="text-5xl font-bold mb-6">Hammy Bot</h1>
        <p className="text-xl mb-8 max-w-2xl">
          A powerful Discord moderation bot with role management, moderation tools, GitHub integration, and more.
        </p>
        <div className="flex gap-4">
          <a
            href={OAUTH_URL}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors"
          >
            Add to Discord
          </a>
          <Link
            href="/dashboard"
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            title="Role Management"
            description="Easily add and remove roles from users with simple slash commands."
            icon="👑"
          />
          <FeatureCard
            title="Moderation Tools"
            description="Warn, kick, ban users and purge messages to keep your server clean."
            icon="🛡️"
          />
          <FeatureCard
            title="Warning System"
            description="Track and manage user warnings with a persistent database."
            icon="⚠️"
          />
          <FeatureCard
            title="Verification System"
            description="Create customizable verification embeds with buttons for new members."
            icon="✅"
          />
          <FeatureCard
            title="GitHub Integration"
            description="Get notifications about repository events directly in your Discord server."
            icon="🔄"
          />
          <FeatureCard
            title="Starboard"
            description="Highlight popular messages in a dedicated channel automatically."
            icon="⭐"
          />
        </div>
      </div>

      {/* Commands Section */}
      <div className="container mx-auto px-4 py-16 bg-gray-800 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8">Popular Commands</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <CommandCard name="/role add" description="Add a role to a user" />
          <CommandCard name="/warn" description="Warn a user with a reason" />
          <CommandCard name="/purge" description="Delete multiple messages at once" />
          <CommandCard name="/github-webhook setup" description="Set up GitHub notifications" />
          <CommandCard name="/verify" description="Create a verification button" />
          <CommandCard name="/starboard setup" description="Set up the starboard feature" />
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to enhance your Discord server?</h2>
        <a
          href={OAUTH_URL}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors"
        >
          Add Hammy Bot Now
        </a>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-700 mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>© 2023 Hammy Bot. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/dashboard" className="text-gray-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/commands" className="text-gray-300 hover:text-white">
              Commands
            </Link>
            <a href="https://github.com/Hammy7361/HammyBot" className="text-gray-300 hover:text-white">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

// Feature Card Component
function FeatureCard({ title, description, icon }) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="text-4xl mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-300">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

// Command Card Component
function CommandCard({ name, description }) {
  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <p className="font-mono text-indigo-400">{name}</p>
      <p className="text-sm text-gray-300 mt-1">{description}</p>
    </div>
  )
}
