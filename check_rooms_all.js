const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rooms = await prisma.chatRoom.findMany({ include: { personalUser: true } });
  console.log(rooms.filter(r => r.visitId === null));
}
main().catch(console.error).finally(() => prisma.$disconnect());
