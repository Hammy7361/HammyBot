"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function ServerDashboard({ params }) {
  const { id } = params
  const [server, setServer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch server data
    setLoading(false)
    setServer({
      id,
      name: `Server ${id}`,
      features: {
        logging: true,
        starboard: false,
        verification: true,
      },
    })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading server data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <Link href="/dashboard/servers">
          <Button>Back to Servers</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{server.name} Dashboard</h1>
        <Link href="/dashboard/servers">
          <Button variant="outline">Back to Servers</Button>
        </Link>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="logging">Logging</TabsTrigger>
          <TabsTrigger value="starboard">Starboard</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Server ID: {server.id}</p>
              <p>Server Name: {server.name}</p>
              <div className="mt-4">
                <Button>Refresh Data</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logging">
          <Card>
            <CardHeader>
              <CardTitle>Logging Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch id="logging" checked={server.features.logging} />
                <Label htmlFor="logging">Enable Logging</Label>
              </div>
              <div className="mt-4">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="starboard">
          <Card>
            <CardHeader>
              <CardTitle>Starboard Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch id="starboard" checked={server.features.starboard} />
                <Label htmlFor="starboard">Enable Starboard</Label>
              </div>
              <div className="mt-4">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Verification Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch id="verification" checked={server.features.verification} />
                <Label htmlFor="verification">Enable Verification</Label>
              </div>
              <div className="mt-4">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
