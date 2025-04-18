// This file serves as the entry point for both the Discord bot and the Next.js web app
const { startBot } = require("./bot")
const next = require("next")
const express = require("express")

// Determine if we're in development or production
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

// Start the bot and web server
async function start() {
  try {
    // Prepare Next.js
    await app.prepare()

    // Create Express server
    const server = express()

    // Handle GitHub webhook endpoint
    server.post("/api/github/webhook", require("./api/github/webhook"))

    // Let Next.js handle all other routes
    server.all("*", (req, res) => {
      return handle(req, res)
    })

    // Start the server
    const PORT = process.env.PORT || 3000
    server.listen(PORT, (err) => {
      if (err) throw err
      console.log(`> Web server ready on http://localhost:${PORT}`)

      // Start the Discord bot
      startBot().catch(console.error)
    })
  } catch (error) {
    console.error("Error starting server:", error)
    process.exit(1)
  }
}

// Start everything
start()
