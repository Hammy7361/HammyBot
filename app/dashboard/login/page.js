"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check for error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get("error")
    if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
  }, [])

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "missing_code":
        return "Authorization code missing. Please try again."
      case "token_exchange":
        return "Failed to exchange token. Please try again."
      case "user_fetch":
        return "Failed to fetch user data. Please try again."
      case "guilds_fetch":
        return "Failed to fetch guilds data. Please try again."
      case "server_error":
        return "An unexpected error occurred. Please try again."
      default:
        return "An error occurred during login. Please try again."
    }
  }

  const handleLogin = () => {
    setIsLoading(true)

    // Get the Discord OAuth URL parameters
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || `${window.location.origin}/api/auth/callback`

    // Define the scopes we need
    const scopes = ["identify", "guilds"].join("%20")

    // Redirect to Discord's OAuth page
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}`
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Dashboard Login</CardTitle>
          <CardDescription className="text-center">
            Log in with your Discord account to manage your servers
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 w-full">{error}</div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="bg-[#5865F2] hover:bg-[#4752C4] flex items-center gap-2"
          >
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"
                    fill="currentColor"
                  />
                </svg>
                <span>Login with Discord</span>
              </>
            )}
          </Button>

          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            Return to Home
          </Link>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          You'll be redirected to Discord to authorize the application
        </CardFooter>
      </Card>
    </div>
  )
}
