// Database client for the application
let prisma

// Try to initialize Prisma client
try {
  const { PrismaClient } = require("@prisma/client")
  prisma = new PrismaClient()
  console.log("Prisma client initialized successfully")
} catch (error) {
  console.error("Failed to initialize Prisma client:", error)
  // Create a mock prisma client with empty methods to prevent crashes
  prisma = {
    loggingChannel: { findUnique: async () => null, create: async () => null, update: async () => null },
    verificationRole: { findUnique: async () => null, create: async () => null, update: async () => null },
    githubWebhook: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async () => null,
      update: async () => null,
      delete: async () => null,
    },
    warning: {
      create: async () => null,
      findMany: async () => [],
      deleteMany: async () => ({ count: 0 }),
      delete: async () => null,
    },
    starboardConfig: { findUnique: async () => null, upsert: async () => null, delete: async () => null },
    starboardMessage: { findUnique: async () => null, upsert: async () => null, update: async () => null },
    $disconnect: async () => {},
  }
}

export default prisma
