import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log("Database is empty, running seed...");
      await import("./seed");
    } else {
      console.log(`Database has ${userCount} users, skipping full seed...`);
    }

    // Always seed project type fields (safe upserts)
    console.log("Updating project type fields...");
    await import("./seed-project-fields").catch((e) => {
      console.warn("Warning: could not update project type fields:", e.message);
    });
  } catch (error) {
    console.error("Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeed();
