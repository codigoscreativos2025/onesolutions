const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rooms = await prisma.chatRoom.findMany({
    include: {
      visit: {
        include: {
          parcel: true,
        }
      },
      messages: true
    }
  });

  console.log("TOTAL CHAT ROOMS:", rooms.length);
  for (const r of rooms) {
    console.log(`Room #${r.id} | Type: ${r.type} | Visit #${r.visitId} | Stage: ${r.visit?.stage} | Address: ${r.visit?.parcel?.address} | PartnerId: ${r.visit?.parcel?.partnerId} | Msgs: ${r.messages.length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
