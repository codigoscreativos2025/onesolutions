const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const templates = await prisma.template.findMany({ select: { id: true, title: true, attachments: true }});
  console.log(templates);
}
main().catch(console.error).finally(() => prisma.$disconnect());
