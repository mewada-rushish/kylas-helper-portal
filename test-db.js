const { PrismaClient } = require("@prisma/client");
require("dotenv/config");

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  try {
    console.log("Testing connection...");
    // Just try to query the User count
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Found ${userCount} users.`);
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
