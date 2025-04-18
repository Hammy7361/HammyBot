"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is authenticated
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/check")
        const data = await response.json()

        if (data.authenticated) {
          // If authenticated, redirect to servers page
          router.push("/dashboard/servers")
        } else {
          // If not authenticated, redirect to login page
          router.push("/dashboard/login")
        }
      } catch (err) {
        console.error("Auth check failed:", err)
        setError("Failed to check authentication status")
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Hammy Bot Dashboard</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/dashboard/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Hammy Bot Dashboard</h1>
        <p className="mb-4">Checking authentication status...</p>
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    )
  }

  // This shouldn't render, but just in case
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Hammy Bot Dashboard</h1>
      <p className="mb-4">Please log in to access the dashboard.</p>
      <Link href="/dashboard/login">
        <Button>Go to Login</Button>
      </Link>
    </div>
  )
}
