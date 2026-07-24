const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pt = await prisma.projectType.findMany();
  console.log(JSON.stringify(pt, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
