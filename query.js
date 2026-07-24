const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const visits = await prisma.visit.findMany({
    include: {
      projects: {
        include: {
          projectType: true
        }
      }
    },
    orderBy: { id: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(visits, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
