const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.chatRoom.deleteMany({
    where: {
      type: "ANNOUNCEMENTS"
    }
  });
  console.log(`Deleted ${result.count} test announcement rooms.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
