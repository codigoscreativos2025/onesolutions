import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log("Database is empty, running seed...");
      // Import and run the seed
      await import("./seed");
    } else {
      console.log(`Database has ${userCount} users, skipping seed...`);
    }
  } catch (error) {
    console.error("Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeed();
