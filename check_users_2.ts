import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.user.findMany().then(u => {
  console.log("Users:", u.map(x => x.email));
  prisma.$disconnect();
});
