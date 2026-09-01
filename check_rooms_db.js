const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rooms = await prisma.chatRoom.findMany({
    include: { personalUser: true },
    where: { type: "ANNOUNCEMENTS" }
  });
  console.log("Total ANNOUNCEMENTS rooms:", rooms.length);
  console.log(rooms.map(r => ({ id: r.id, userId: r.personalUserId, name: r.personalUser?.name })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
