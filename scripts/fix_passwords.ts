import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  
  await prisma.user.updateMany({
    where: { email: { startsWith: 'test' } },
    data: { password: hash }
  });
  
  console.log("Updated test users passwords to hashed 'password123'");
}

main().finally(() => prisma.$disconnect());
