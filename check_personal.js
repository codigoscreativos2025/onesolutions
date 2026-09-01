const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rooms = await prisma.chatRoom.findMany({
    include: { personalUser: true },
    where: { type: "PERSONAL" }
  });
  console.log("Total PERSONAL rooms:", rooms.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
