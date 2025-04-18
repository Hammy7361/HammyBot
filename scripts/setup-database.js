const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("Setting up database...")

  // You can add any initial data setup here if needed

  console.log("Database setup complete!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("Error setting up database:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
