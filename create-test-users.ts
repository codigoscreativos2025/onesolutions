import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encrypt } from "./lib/encryption";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin", 10);
  const encryptedHash = encrypt("admin");

  const testUser1 = await prisma.user.create({
    data: {
      email: "testuser1@onesolutions.com",
      name: "Test User 1",
      password: hash,
      encryptedPassword: encryptedHash,
      role: "SETTER"
    }
  });

  const testUser2 = await prisma.user.create({
    data: {
      email: "testuser2@onesolutions.com",
      name: "Test User 2",
      password: hash,
      encryptedPassword: encryptedHash,
      role: "CLOSER"
    }
  });

  console.log("Created test users:", testUser1.email, testUser2.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
