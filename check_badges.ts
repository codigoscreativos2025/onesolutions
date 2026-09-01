import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.badge.findMany().then(b => {
  console.log(b);
  prisma.$disconnect();
});
