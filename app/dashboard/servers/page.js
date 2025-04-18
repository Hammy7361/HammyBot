"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ServersPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Check if user is authenticated
        const authResponse = await fetch("/api/auth/check")
        const authData = await authResponse.json()

        if (!authData.authenticated) {
          router.push("/dashboard/login")
          return
        }

        setUser(authData.user)

        // Fetch servers
        const serversResponse = await fetch("/api/discord/servers")

        if (!serversResponse.ok) {
          throw new Error("Failed to fetch servers")
        }

        const serversData = await serversResponse.json()
        setServers(serversData)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleServerClick = (serverId) => {
    router.push(`/dashboard/server/${serverId}`)
  }

  const handleLoginAgain = () => {
    router.push("/dashboard/login")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="ml-4">Loading your servers...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {user ? (
        <div className="flex items-center mb-6">
          <img
            src={
              user.avatar
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                : "https://cdn.discordapp.com/embed/avatars/0.png"
            }
            alt={user.username}
            className="w-10 h-10 rounded-full mr-3"
          />
          <h1 className="text-3xl font-bold">Welcome, {user.username}</h1>
        </div>
      ) : (
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      )}

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <Button onClick={handleLoginAgain} className="mt-4">
            Login Again
          </Button>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-4">Your Servers</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((server) => (
              <Card key={server.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{server.name}</CardTitle>
                  <CardDescription>Server ID: {server.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleServerClick(server.id)}>Manage Server</Button>
                </CardContent>
              </Card>
            ))}

            {servers.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 mb-4">You don't have any servers with the bot installed.</p>
                <Button
                  onClick={() =>
                    window.open(
                      `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`,
                      "_blank",
                    )
                  }
                >
                  Add Bot to Server
                </Button>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
